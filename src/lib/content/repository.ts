import type {
  ArticleSource,
  ArticleSummary,
  CanonicalArticle,
  PublishResult,
} from '../markdown/types'

export interface ContentRepository {
  listArticles(): Promise<ArticleSummary[]>
  getArticle(slug: string): Promise<ArticleSource | null>
  createArticle(article: CanonicalArticle): Promise<PublishResult>
  updateArticle(article: CanonicalArticle): Promise<PublishResult>
  deleteArticle(slug: string): Promise<void>
}

export class ContentRepositoryError extends Error {
  public statusCode: number
  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'ContentRepositoryError'
    this.statusCode = statusCode
  }
}
