import type { ArticleMetadata } from '../markdown/types'

export interface SeoMetaOptions {
  title: string
  description?: string
  canonicalUrl: string
  type?: 'website' | 'article'
  articleMeta?: ArticleMetadata
}

export function generateStructuredData(article: ArticleMetadata, canonicalUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': article.type === 'research' ? 'TechArticle' : 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url: canonicalUrl,
    keywords: article.tags.join(', '),
    author: {
      '@type': 'Person',
      name: 'Journal Author',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Personal Research Journal',
    },
  }
}
