import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getContentRepository } from '../content'
import { parseArticle } from '../markdown/parse'
import { validateArticle } from '../markdown/validate'
import { serializeArticle } from '../markdown/serialize'
import { SESSION_COOKIE_NAME, verifySessionToken } from '../auth/session'
import type {
  Article,
  ArticleMetadata,
  ArticleSummary,
  PublishResult,
} from '../markdown/types'

function requireAuth(): void {
  const cookie = getCookie(SESSION_COOKIE_NAME)
  const session = cookie ? verifySessionToken(cookie) : null
  if (!session || session.role !== 'admin') {
    throw new Error('Unauthorized: Admin session required')
  }
}

export const getArticlesServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ArticleSummary[]> => {
    const repo = getContentRepository()
    return await repo.listArticles()
  }
)

export const getArticleBySlugServerFn = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Article | null> => {
    const repo = getContentRepository()
    const source = await repo.getArticle(slug)
    if (!source) return null

    const fullMarkdown = serializeArticle(source.metadata, source.markdown)
    return parseArticle(fullMarkdown)
  })

export const publishArticleServerFn = createServerFn({ method: 'POST' })
  .validator((data: { markdown: string; metadata: ArticleMetadata }) => data)
  .handler(async ({ data }): Promise<PublishResult> => {
    requireAuth()

    const repo = getContentRepository()
    const existing = await repo.listArticles()
    const existingSlugs = existing.map((a) => a.metadata.slug)

    const health = validateArticle(data.markdown, data.metadata, { existingSlugs })
    if (!health.valid) {
      const firstError = health.items.find((i) => i.type === 'error')?.message || 'Article validation failed'
      return { success: false, slug: data.metadata.slug, url: '', error: firstError }
    }

    try {
      return await repo.createArticle({
        metadata: data.metadata,
        markdown: data.markdown,
      })
    } catch (err: any) {
      return {
        success: false,
        slug: data.metadata.slug,
        url: '',
        error: err.message || 'Failed to create article in repository',
      }
    }
  })

export const updateArticleServerFn = createServerFn({ method: 'POST' })
  .validator((data: { markdown: string; metadata: ArticleMetadata }) => data)
  .handler(async ({ data }): Promise<PublishResult> => {
    requireAuth()

    const repo = getContentRepository()
    const health = validateArticle(data.markdown, data.metadata)
    if (!health.valid) {
      const firstError = health.items.find((i) => i.type === 'error')?.message || 'Article validation failed'
      return { success: false, slug: data.metadata.slug, url: '', error: firstError }
    }

    try {
      return await repo.updateArticle({
        metadata: data.metadata,
        markdown: data.markdown,
      })
    } catch (err: any) {
      return {
        success: false,
        slug: data.metadata.slug,
        url: '',
        error: err.message || 'Failed to update article in repository',
      }
    }
  })

export const deleteArticleServerFn = createServerFn({ method: 'POST' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<{ success: boolean; error?: string }> => {
    requireAuth()

    try {
      const repo = getContentRepository()
      await repo.deleteArticle(slug)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete article' }
    }
  })
