import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArticle } from '../markdown/parse'
import { serializeArticle } from '../markdown/serialize'
import type {
  ArticleSource,
  ArticleSummary,
  CanonicalArticle,
  PublishResult,
} from '../markdown/types'
import { ContentRepository, ContentRepositoryError } from './repository'

export class LocalFileContentRepository implements ContentRepository {
  private baseDir: string
  private publicSiteUrl: string

  constructor(
    baseDir = path.join(process.cwd(), 'content/articles'),
    publicSiteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
  ) {
    this.baseDir = baseDir
    this.publicSiteUrl = publicSiteUrl.replace(/\/+$/, '')
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true })
    } catch {
      // Directory exists or created
    }
  }

  private getFilePath(slug: string): string {
    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '')
    return path.join(this.baseDir, `${cleanSlug}.md`)
  }

  async listArticles(): Promise<ArticleSummary[]> {
    await this.ensureDirectory()
    try {
      const files = await fs.readdir(this.baseDir)
      const mdFiles = files.filter((f) => f.endsWith('.md'))

      const summaries: ArticleSummary[] = []

      for (const file of mdFiles) {
        try {
          const filePath = path.join(this.baseDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const article = parseArticle(content)
          summaries.push({
            metadata: article.metadata,
            readingTimeMinutes: article.readingTimeMinutes,
          })
        } catch (err) {
          console.warn(`Failed to parse article file ${file}:`, err)
        }
      }

      // Sort newest first by publishedAt (or updatedAt if newer)
      return summaries.sort((a, b) => {
        const dateA = a.metadata.publishedAt
        const dateB = b.metadata.publishedAt
        return dateB.localeCompare(dateA)
      })
    } catch {
      return []
    }
  }

  async getArticle(slug: string): Promise<ArticleSource | null> {
    await this.ensureDirectory()
    const filePath = this.getFilePath(slug)
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = parseArticle(raw)
      return {
        metadata: parsed.metadata,
        markdown: parsed.markdown,
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw new ContentRepositoryError(`Failed to read article: ${err.message}`, 500)
    }
  }

  async createArticle(article: CanonicalArticle): Promise<PublishResult> {
    await this.ensureDirectory()
    const slug = article.metadata.slug
    const filePath = this.getFilePath(slug)

    try {
      await fs.access(filePath)
      throw new ContentRepositoryError(`Article with slug "${slug}" already exists`, 409)
    } catch (err: any) {
      if (err instanceof ContentRepositoryError) throw err
      // File does not exist, proceed to write
    }

    const fileContent = serializeArticle(article.metadata, article.markdown)
    await fs.writeFile(filePath, fileContent, 'utf-8')

    return {
      success: true,
      slug,
      url: `${this.publicSiteUrl}/articles/${slug}`,
    }
  }

  async updateArticle(article: CanonicalArticle): Promise<PublishResult> {
    await this.ensureDirectory()
    const slug = article.metadata.slug
    const filePath = this.getFilePath(slug)

    try {
      await fs.access(filePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new ContentRepositoryError(`Article with slug "${slug}" not found`, 404)
      }
      throw err
    }

    const updatedMetadata = {
      ...article.metadata,
      updatedAt: article.metadata.updatedAt || new Date().toISOString().slice(0, 10),
    }

    const fileContent = serializeArticle(updatedMetadata, article.markdown)
    await fs.writeFile(filePath, fileContent, 'utf-8')

    return {
      success: true,
      slug,
      url: `${this.publicSiteUrl}/articles/${slug}`,
    }
  }

  async deleteArticle(slug: string): Promise<void> {
    await this.ensureDirectory()
    const filePath = this.getFilePath(slug)
    try {
      await fs.unlink(filePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new ContentRepositoryError(`Article with slug "${slug}" not found`, 404)
      }
      throw new ContentRepositoryError(`Failed to delete article: ${err.message}`, 500)
    }
  }
}
