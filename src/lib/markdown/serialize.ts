import { serializeFrontmatter } from './metadata'
import type { ArticleMetadata } from './types'

/**
 * Serializes article metadata and body markdown into canonical Markdown with YAML frontmatter.
 */
export function serializeArticle(metadata: ArticleMetadata, bodyMarkdown: string): string {
  const frontmatter = serializeFrontmatter(metadata)
  const cleanBody = (bodyMarkdown || '').trim()
  return `${frontmatter}\n${cleanBody}\n`
}
