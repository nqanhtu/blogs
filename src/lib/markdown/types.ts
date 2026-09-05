export type ArticleType = 'research' | 'note'

export interface ArticleMetadata {
  title: string
  slug: string
  description: string
  type: ArticleType
  tags: string[]
  publishedAt: string
  updatedAt?: string
}

export interface ArticleHeading {
  id: string
  text: string
  level: number
}

export interface Article {
  metadata: ArticleMetadata
  markdown: string
  readingTimeMinutes: number
  headings: ArticleHeading[]
}

export interface ArticleSummary {
  metadata: ArticleMetadata
  readingTimeMinutes: number
}

export type HealthStatus = 'success' | 'warning' | 'error'

export interface ArticleHealthItem {
  type: HealthStatus
  message: string
}

export interface ArticleHealth {
  valid: boolean
  items: ArticleHealthItem[]
  stats: {
    codeBlocks: number
    externalLinks: number
    wordCount: number
    readingTimeMinutes: number
    headingsCount: number
  }
}

export interface PublishResult {
  success: boolean
  slug: string
  url: string
  error?: string
}

export interface CanonicalArticle {
  metadata: ArticleMetadata
  markdown: string
}

export interface ArticleSource {
  metadata: ArticleMetadata
  markdown: string
  sha?: string
}
