import { describe, it, expect } from 'vitest'
import { generateSlug, isValidSlug, removeVietnameseDiacritics } from '../../src/lib/markdown/slug'
import { calculateReadingTime, formatReadingTime } from '../../src/lib/markdown/reading-time'
import { detectChatGPTCitations } from '../../src/lib/markdown/citations'
import {
  extractFirstH1,
  parseFrontmatter,
  serializeFrontmatter,
  ArticleMetadataSchema,
} from '../../src/lib/markdown/metadata'
import { normalizeMarkdown, linkifyBareUrls, sanitizeDangerousHtml } from '../../src/lib/markdown/normalize'
import { validateArticle } from '../../src/lib/markdown/validate'
import { serializeArticle } from '../../src/lib/markdown/serialize'
import { parseArticle } from '../../src/lib/markdown/parse'

describe('Vietnamese Slug Generation', () => {
  it('removes Vietnamese diacritics cleanly', () => {
    const result = removeVietnameseDiacritics('Lexical Environment trong JavaScript')
    expect(result).toBe('Lexical Environment trong JavaScript')

    const vietnamesePhrase = 'Cơ chế hoạt động của React Fiber và Virtual DOM'
    expect(removeVietnameseDiacritics(vietnamesePhrase)).toBe(
      'Co che hoat dong cua React Fiber va Virtual DOM'
    )
  })

  it('generates URL-safe slugs with Vietnamese titles', () => {
    expect(generateSlug('Lexical Environment trong JavaScript')).toBe(
      'lexical-environment-trong-javascript'
    )
    expect(
      generateSlug('Tìm hiểu về Concurrency và Asynchronous trong Node.js (Phần 1)')
    ).toBe('tim-hieu-ve-concurrency-va-asynchronous-trong-node-js-phan-1')
  })

  it('validates slugs with isValidSlug', () => {
    expect(isValidSlug('valid-slug-123')).toBe(true)
    expect(isValidSlug('docker-images-and-containers')).toBe(true)
    expect(isValidSlug('Invalid_Slug')).toBe(false)
    expect(isValidSlug('slug with spaces')).toBe(false)
    expect(isValidSlug('-leading-hyphen')).toBe(false)
  })
})

describe('Reading Time Calculation', () => {
  it('calculates reading time from readable prose only', () => {
    const markdown = `
# Title

Here is a paragraph of text explaining the core concepts of asynchronous programming in TypeScript.
Each word counts towards readable prose.

\`\`\`typescript
// This code block should not artificially inflate prose word count
const a = 1;
const b = 2;
console.log(a + b);
\`\`\`

More explanation here.
`
    const time = calculateReadingTime(markdown)
    expect(time).toBe(1)
    expect(formatReadingTime(time)).toBe('1 min read')
  })
})

describe('ChatGPT Citation Detection', () => {
  it('detects ChatGPT non-portable citations', () => {
    const inputWithCitations = `
According to the latest research【4:0†source】, Vite uses Rollup for production builds.
Another source mentions【12†source】that Nitro powers the server layer.
`
    const res = detectChatGPTCitations(inputWithCitations)
    expect(res.hasUnresolved).toBe(true)
    expect(res.artifacts).toContain('【4:0†source】')
    expect(res.artifacts).toContain('【12†source】')
  })

  it('returns false when no citations exist', () => {
    const cleanInput = `
Vite uses Rollup for production builds [see docs](https://vite.dev).
`
    const res = detectChatGPTCitations(cleanInput)
    expect(res.hasUnresolved).toBe(false)
    expect(res.artifacts.length).toBe(0)
  })
})

describe('Frontmatter Parsing & Serialization', () => {
  it('extracts first H1 title and removes it from body', () => {
    const md = '# Docker Images & Containers\n\nDocker images are immutable templates.'
    const { title, remainingMarkdown } = extractFirstH1(md)
    expect(title).toBe('Docker Images & Containers')
    expect(remainingMarkdown).toBe('Docker images are immutable templates.')
  })

  it('parses and serializes YAML frontmatter', () => {
    const meta = {
      title: 'Docker Architecture',
      slug: 'docker-architecture',
      description: 'A deep dive into containers.',
      type: 'research' as const,
      tags: ['docker', 'devops'],
      publishedAt: '2026-09-05',
    }
    const yaml = serializeFrontmatter(meta)
    expect(yaml).toContain('title: Docker Architecture')
    expect(yaml).toContain('slug: docker-architecture')

    const { metadata: parsed, content } = parseFrontmatter(`${yaml}\nBody text here.`)
    expect(parsed?.title).toBe('Docker Architecture')
    expect(parsed?.slug).toBe('docker-architecture')
    expect(content.trim()).toBe('Body text here.')
  })

  it('validates metadata schema with Zod', () => {
    const valid = {
      title: 'Valid Title',
      slug: 'valid-slug',
      description: 'Short desc',
      type: 'research',
      tags: ['test'],
      publishedAt: '2026-09-05',
    }
    expect(ArticleMetadataSchema.safeParse(valid).success).toBe(true)

    const invalid = {
      title: '',
      slug: 'Invalid Slug!',
      type: 'invalid-type',
      publishedAt: 'not-a-date',
    }
    expect(ArticleMetadataSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('Markdown Normalization', () => {
  it('collapses excessive blank lines and sanitizes dangerous HTML', () => {
    const raw = `
# My Heading



Paragraph after multiple lines.

<script>alert("hack")</script>

\`\`\`js
const x = 1;
\`\`\`
`
    const { normalizedMarkdown, extractedTitle } = normalizeMarkdown(raw)
    expect(extractedTitle).toBe('My Heading')
    expect(normalizedMarkdown).not.toContain('<script>')
    expect(normalizedMarkdown).not.toMatch(/\n{3,}/)
    expect(normalizedMarkdown).toContain('```javascript')
  })

  it('auto-linkifies bare URLs', () => {
    const text = 'Check out https://example.com for more info.'
    const res = linkifyBareUrls(text)
    expect(res).toBe('Check out <https://example.com> for more info.')
  })

  it('sanitizes dangerous HTML but preserves text', () => {
    const unsafe = '<script>evil()</script><iframe src="javascript:evil()"></iframe>Hello'
    expect(sanitizeDangerousHtml(unsafe)).toBe('Hello')
  })
})

describe('Article Health Validation', () => {
  it('validates a well-formed article with success status', () => {
    const md = `## Section 1\n\nExplanation with [Link](https://google.com).\n\n\`\`\`ts\nconst a = 1\n\`\`\`\n`
    const meta = {
      title: 'Valid Article',
      slug: 'valid-article',
      description: 'Useful description',
      type: 'research' as const,
      tags: ['ts'],
      publishedAt: '2026-09-05',
    }
    const health = validateArticle(md, meta)
    expect(health.valid).toBe(true)
    expect(health.stats.codeBlocks).toBe(1)
    expect(health.stats.externalLinks).toBe(1)
  })

  it('blocks publication when unresolved ChatGPT citation is present', () => {
    const md = `Mental model【1:2†source】details.`
    const meta = {
      title: 'Article with Citation',
      slug: 'article-with-citation',
      description: 'Desc',
      type: 'research' as const,
      tags: [],
      publishedAt: '2026-09-05',
    }
    const health = validateArticle(md, meta)
    expect(health.valid).toBe(false)
    expect(health.items.some((i) => i.type === 'error' && i.message.includes('ChatGPT citation'))).toBe(true)
  })

  it('blocks publication when duplicate H1 is present in body', () => {
    const md = `# Extra H1\n\nBody content`
    const meta = {
      title: 'Title in Metadata',
      slug: 'slug',
      publishedAt: '2026-09-05',
    }
    const health = validateArticle(md, meta)
    expect(health.valid).toBe(false)
    expect(health.items.some((i) => i.type === 'error' && i.message.includes('Duplicate H1'))).toBe(true)
  })

  it('detects slug collisions', () => {
    const md = `## Content`
    const meta = {
      title: 'Article',
      slug: 'existing-slug',
      publishedAt: '2026-09-05',
    }
    const health = validateArticle(md, meta, { existingSlugs: ['existing-slug'] })
    expect(health.valid).toBe(false)
    expect(health.items.some((i) => i.type === 'error' && i.message.includes('already in use'))).toBe(true)
  })
})

describe('Canonical Serialization & Parsing', () => {
  it('round-trips an article through serialize and parse', () => {
    const originalMeta = {
      title: 'Mental Models in Rust',
      slug: 'mental-models-in-rust',
      description: 'Ownership and borrowing explained.',
      type: 'research' as const,
      tags: ['rust', 'systems'],
      publishedAt: '2026-09-05',
    }
    const body = '## Ownership\n\nRust ensures memory safety without GC.'
    const serialized = serializeArticle(originalMeta, body)

    const parsed = parseArticle(serialized)
    expect(parsed.metadata.title).toBe(originalMeta.title)
    expect(parsed.metadata.slug).toBe(originalMeta.slug)
    expect(parsed.headings.length).toBe(1)
    expect(parsed.headings[0]?.text).toBe('Ownership')
    expect(parsed.markdown).toBe(body)
  })
})
