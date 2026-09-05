import { parseArticle } from '../markdown/parse'
import { serializeArticle } from '../markdown/serialize'
import type {
  ArticleSource,
  ArticleSummary,
  CanonicalArticle,
  PublishResult,
} from '../markdown/types'
import { ContentRepository, ContentRepositoryError } from './repository'

export interface GitHubRepoConfig {
  token?: string
  owner?: string
  repo?: string
  branch?: string
  contentDirectory?: string
  publicSiteUrl?: string
  fetchFn?: typeof fetch
}

export class GitHubContentRepository implements ContentRepository {
  private token: string
  private owner: string
  private repo: string
  private branch: string
  private contentDir: string
  private publicSiteUrl: string
  private fetch: typeof fetch

  constructor(config: GitHubRepoConfig = {}) {
    this.token = config.token || process.env.GITHUB_TOKEN || ''
    this.owner = config.owner || process.env.GITHUB_OWNER || ''
    this.repo = config.repo || process.env.GITHUB_REPO || ''
    this.branch = config.branch || process.env.GITHUB_BRANCH || 'main'
    this.contentDir = (config.contentDirectory || process.env.GITHUB_CONTENT_DIRECTORY || 'content/articles').replace(/^\/+|\/+$/g, '')
    this.publicSiteUrl = (config.publicSiteUrl || process.env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
    this.fetch = config.fetchFn || globalThis.fetch
  }

  private validateConfig(): void {
    if (!this.token || !this.owner || !this.repo) {
      throw new ContentRepositoryError(
        'GitHub configuration is incomplete. GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are required.',
        500
      )
    }
  }

  private getFilePath(slug: string): string {
    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '')
    return `${this.contentDir}/${cleanSlug}.md`
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    this.validateConfig()
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}${path}`
    const headers = new Headers(options.headers || {})
    headers.set('Authorization', `Bearer ${this.token}`)
    headers.set('Accept', 'application/vnd.github.v3+json')
    headers.set('User-Agent', 'Personal-Markdown-Research-Publisher')

    let response: Response
    try {
      response = await this.fetch(url, {
        ...options,
        headers,
      })
    } catch (err: any) {
      throw new ContentRepositoryError(`Network error reaching GitHub API: ${err.message}`, 503)
    }

    if (!response.ok) {
      const status = response.status
      if (status === 401) {
        throw new ContentRepositoryError('GitHub authentication failed: invalid token', 401)
      }
      if (status === 403) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
        if (rateLimitRemaining === '0') {
          throw new ContentRepositoryError('GitHub API rate limit exceeded. Please wait before retrying.', 429)
        }
        throw new ContentRepositoryError('GitHub API access forbidden: check repository permissions', 403)
      }
      if (status === 404) {
        throw new ContentRepositoryError('Resource not found on GitHub', 404)
      }
      if (status === 409) {
        throw new ContentRepositoryError('GitHub conflict: remote content has changed or SHA mismatch', 409)
      }
      if (status === 422) {
        throw new ContentRepositoryError('GitHub validation failed (422 Unprocessable Entity)', 422)
      }
      throw new ContentRepositoryError(`GitHub API error (status ${status})`, status)
    }

    return response
  }

  async listArticles(): Promise<ArticleSummary[]> {
    try {
      const res = await this.request(`/contents/${this.contentDir}?ref=${encodeURIComponent(this.branch)}`)
      const items = (await res.json()) as Array<{ name: string; type: string; path: string }>

      if (!Array.isArray(items)) return []

      const mdItems = items.filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      const summaries: ArticleSummary[] = []

      // Read each article
      for (const item of mdItems) {
        const slug = item.name.replace(/\.md$/, '')
        try {
          const article = await this.getArticle(slug)
          if (article) {
            summaries.push({
              metadata: article.metadata,
              readingTimeMinutes: parseArticle(
                serializeArticle(article.metadata, article.markdown)
              ).readingTimeMinutes,
            })
          }
        } catch {
          // Skip unparseable remote items
        }
      }

      return summaries.sort((a, b) => b.metadata.publishedAt.localeCompare(a.metadata.publishedAt))
    } catch (err: any) {
      if (err.statusCode === 404) return []
      throw err
    }
  }

  private getEncodedPath(slug: string): string {
    const filePath = this.getFilePath(slug)
    return filePath.split('/').map(encodeURIComponent).join('/')
  }

  async getArticle(slug: string): Promise<ArticleSource | null> {
    const encodedPath = this.getEncodedPath(slug)
    try {
      const res = await this.request(
        `/contents/${encodedPath}?ref=${encodeURIComponent(this.branch)}`
      )
      const data = (await res.json()) as { content: string; encoding: string; sha: string }

      let rawMarkdown = ''
      if (data.encoding === 'base64') {
        rawMarkdown = Buffer.from(data.content, 'base64').toString('utf-8')
      } else {
        rawMarkdown = data.content
      }

      const parsed = parseArticle(rawMarkdown)
      return {
        metadata: parsed.metadata,
        markdown: parsed.markdown,
        sha: data.sha,
      }
    } catch (err: any) {
      if (err.statusCode === 404) return null
      throw err
    }
  }

  async createArticle(article: CanonicalArticle): Promise<PublishResult> {
    const slug = article.metadata.slug
    const encodedPath = this.getEncodedPath(slug)

    // Check if article already exists
    const existing = await this.getArticle(slug)
    if (existing) {
      throw new ContentRepositoryError(`Article with slug "${slug}" already exists`, 409)
    }

    const content = serializeArticle(article.metadata, article.markdown)
    const base64Content = Buffer.from(content, 'utf-8').toString('base64')

    await this.request(`/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Publish article: ${article.metadata.title}`,
        content: base64Content,
        branch: this.branch,
      }),
    })

    return {
      success: true,
      slug,
      url: `${this.publicSiteUrl}/articles/${slug}`,
    }
  }

  async updateArticle(article: CanonicalArticle): Promise<PublishResult> {
    const slug = article.metadata.slug
    const encodedPath = this.getEncodedPath(slug)

    // Must obtain current SHA to ensure no remote conflict overwrite
    const existing = await this.getArticle(slug)
    if (!existing || !existing.sha) {
      throw new ContentRepositoryError(`Article with slug "${slug}" not found on GitHub`, 404)
    }

    const updatedMetadata = {
      ...article.metadata,
      updatedAt: article.metadata.updatedAt || new Date().toISOString().slice(0, 10),
    }

    const content = serializeArticle(updatedMetadata, article.markdown)
    const base64Content = Buffer.from(content, 'utf-8').toString('base64')

    await this.request(`/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Update article: ${updatedMetadata.title}`,
        content: base64Content,
        sha: existing.sha,
        branch: this.branch,
      }),
    })

    return {
      success: true,
      slug,
      url: `${this.publicSiteUrl}/articles/${slug}`,
    }
  }

  async deleteArticle(slug: string): Promise<void> {
    const encodedPath = this.getEncodedPath(slug)
    const existing = await this.getArticle(slug)
    if (!existing || !existing.sha) {
      throw new ContentRepositoryError(`Article with slug "${slug}" not found on GitHub`, 404)
    }

    await this.request(`/contents/${encodedPath}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Delete article: ${slug}`,
        sha: existing.sha,
        branch: this.branch,
      }),
    })
  }
}
