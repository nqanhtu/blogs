import { describe, it, expect } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArticle } from '../../src/lib/markdown/parse'
import { validateArticle } from '../../src/lib/markdown/validate'

describe('Markdown Renderer Fixture Verification', () => {
  it('parses and validates the comprehensive fixture article', async () => {
    const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/sample-article.md')
    const content = await fs.readFile(fixturePath, 'utf-8')

    const article = parseArticle(content)
    expect(article.metadata.title).toBe('Complete Markdown Specification Fixture')
    expect(article.metadata.slug).toBe('complete-markdown-specification-fixture')
    expect(article.headings.length).toBeGreaterThanOrEqual(4)
    expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(1)

    const health = validateArticle(article.markdown, article.metadata)
    expect(health.valid).toBe(true)
    expect(health.stats.codeBlocks).toBeGreaterThanOrEqual(2)
    expect(health.stats.externalLinks).toBeGreaterThanOrEqual(1)
  })
})
