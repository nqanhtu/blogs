import yaml from 'js-yaml'
import { z } from 'zod'
import type { ArticleMetadata, ArticleType } from './types'

export const ArticleMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().default(''),
  type: z.enum(['research', 'note'] as const),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'publishedAt must be YYYY-MM-DD format'),
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt must be YYYY-MM-DD format')
    .optional(),
})

export type ArticleMetadataInput = z.input<typeof ArticleMetadataSchema>

/**
 * Extracts the first H1 heading (# Heading) from markdown if present.
 * Returns the extracted title and the remaining markdown with that H1 removed.
 */
export function extractFirstH1(markdown: string): {
  title: string | null
  remainingMarkdown: string
} {
  const match = markdown.match(/^(?:[\t ]*)#\s+([^\n\r]+)(?:\r?\n|$)/m)
  if (!match || match.index === undefined) {
    return { title: null, remainingMarkdown: markdown }
  }

  const title = match[1]?.trim() || null
  const before = markdown.slice(0, match.index)
  const after = markdown.slice(match.index + match[0].length)
  const remainingMarkdown = (before + after).replace(/^\r?\n+/, '')

  return { title, remainingMarkdown }
}

/**
 * Parses frontmatter from a markdown string using safe YAML parsing.
 */
export function parseFrontmatter(raw: string): {
  metadata: Partial<ArticleMetadata> | null
  content: string
} {
  const frontmatterRegex = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
  const match = raw.match(frontmatterRegex)

  if (!match) {
    return { metadata: null, content: raw }
  }

  const rawYaml = match[1] ?? ''
  const content = raw.slice(match[0].length)

  try {
    const parsed = yaml.load(rawYaml)
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      const meta: Partial<ArticleMetadata> = {}

      if (typeof obj.title === 'string') meta.title = obj.title
      if (typeof obj.slug === 'string') meta.slug = obj.slug
      if (typeof obj.description === 'string') meta.description = obj.description
      if (obj.type === 'research' || obj.type === 'note') meta.type = obj.type as ArticleType
      if (Array.isArray(obj.tags)) {
        meta.tags = obj.tags.map((t) => String(t).trim()).filter(Boolean)
      }
      if (typeof obj.publishedAt === 'string') meta.publishedAt = obj.publishedAt
      else if (obj.publishedAt instanceof Date) {
        meta.publishedAt = obj.publishedAt.toISOString().slice(0, 10)
      }
      if (typeof obj.updatedAt === 'string') meta.updatedAt = obj.updatedAt
      else if (obj.updatedAt instanceof Date) {
        meta.updatedAt = obj.updatedAt.toISOString().slice(0, 10)
      }

      return { metadata: meta, content }
    }
  } catch {
    // If invalid YAML, treat as no frontmatter
  }

  return { metadata: null, content: raw }
}

/**
 * Serializes article metadata to a clean YAML frontmatter block.
 */
export function serializeFrontmatter(metadata: ArticleMetadata): string {
  const data: Record<string, unknown> = {
    title: metadata.title,
    slug: metadata.slug,
    description: metadata.description || '',
    type: metadata.type,
    tags: metadata.tags,
    publishedAt: metadata.publishedAt,
  }

  if (metadata.updatedAt) {
    data.updatedAt = metadata.updatedAt
  }

  const yamlStr = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  })

  return `---\n${yamlStr}---\n`
}
