import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { LocalFileContentRepository } from '../../src/lib/content/local-file.repository'
import { GitHubContentRepository } from '../../src/lib/content/github.repository'
import { ContentRepositoryError } from '../../src/lib/content/repository'
import { serializeArticle } from '../../src/lib/markdown/serialize'

describe('LocalFileContentRepository', () => {
  let tempDir: string
  let repo: LocalFileContentRepository

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'publisher-test-'))
    repo = new LocalFileContentRepository(tempDir, 'http://test-site.local')
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('creates an article and lists it', async () => {
    const article = {
      metadata: {
        title: 'Test Article',
        slug: 'test-article',
        description: 'A test description',
        type: 'research' as const,
        tags: ['test'],
        publishedAt: '2026-09-05',
      },
      markdown: '## Heading\n\nContent here.',
    }

    const result = await repo.createArticle(article)
    expect(result.success).toBe(true)
    expect(result.slug).toBe('test-article')
    expect(result.url).toBe('http://test-site.local/articles/test-article')

    // Read back
    const fetched = await repo.getArticle('test-article')
    expect(fetched).not.toBeNull()
    expect(fetched?.metadata.title).toBe('Test Article')
    expect(fetched?.markdown).toBe('## Heading\n\nContent here.')

    // List articles
    const list = await repo.listArticles()
    expect(list.length).toBe(1)
    expect(list[0]?.metadata.slug).toBe('test-article')
  })

  it('throws 409 on duplicate slug collision when creating', async () => {
    const article = {
      metadata: {
        title: 'Collision Article',
        slug: 'collision-article',
        description: 'A test',
        type: 'note' as const,
        tags: [],
        publishedAt: '2026-09-05',
      },
      markdown: 'Body',
    }

    await repo.createArticle(article)

    await expect(repo.createArticle(article)).rejects.toThrowError(
      /already exists/
    )
  })

  it('updates an existing article and preserves publication date', async () => {
    const article = {
      metadata: {
        title: 'Updatable Article',
        slug: 'updatable-article',
        description: 'Original',
        type: 'research' as const,
        tags: ['original'],
        publishedAt: '2026-09-01',
      },
      markdown: 'Original content',
    }

    await repo.createArticle(article)

    const updated = {
      metadata: {
        ...article.metadata,
        title: 'Updated Title',
        description: 'Updated Description',
        updatedAt: '2026-09-05',
      },
      markdown: 'Updated content',
    }

    const result = await repo.updateArticle(updated)
    expect(result.success).toBe(true)

    const fetched = await repo.getArticle('updatable-article')
    expect(fetched?.metadata.title).toBe('Updated Title')
    expect(fetched?.metadata.publishedAt).toBe('2026-09-01')
    expect(fetched?.metadata.updatedAt).toBe('2026-09-05')
  })

  it('deletes an article and subsequent get returns null', async () => {
    const article = {
      metadata: {
        title: 'Delete Me',
        slug: 'delete-me',
        description: '',
        type: 'note' as const,
        tags: [],
        publishedAt: '2026-09-05',
      },
      markdown: 'Ephemeral',
    }

    await repo.createArticle(article)
    expect(await repo.getArticle('delete-me')).not.toBeNull()

    await repo.deleteArticle('delete-me')
    expect(await repo.getArticle('delete-me')).toBeNull()
  })
})

describe('GitHubContentRepository (Mocked)', () => {
  it('handles create request with proper headers and commit payload', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined

    const mockFetch = async (url: any, init?: RequestInit) => {
      capturedUrl = String(url)
      capturedInit = init

      // Return 404 for check if existing
      if (init?.method === undefined || init?.method === 'GET') {
        return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
      }

      // Return 201 for PUT
      if (init?.method === 'PUT') {
        return new Response(JSON.stringify({ content: { name: 'gh-test.md' } }), { status: 201 })
      }

      return new Response(JSON.stringify({}), { status: 200 })
    }

    const repo = new GitHubContentRepository({
      token: 'fake-token',
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      contentDirectory: 'content/articles',
      publicSiteUrl: 'https://mysite.com',
      fetchFn: mockFetch as any,
    })

    const result = await repo.createArticle({
      metadata: {
        title: 'GH Test',
        slug: 'gh-test',
        description: 'Desc',
        type: 'research',
        tags: ['gh'],
        publishedAt: '2026-09-05',
      },
      markdown: 'Body from GH',
    })

    expect(result.success).toBe(true)
    expect(result.url).toBe('https://mysite.com/articles/gh-test')
    expect(capturedUrl).toContain('api.github.com/repos/test-owner/test-repo/contents/content/articles/gh-test.md')
    expect(capturedInit?.method).toBe('PUT')

    const parsedBody = JSON.parse(String(capturedInit?.body))
    expect(parsedBody.message).toContain('Publish article: GH Test')
    expect(parsedBody.branch).toBe('main')
    expect(parsedBody.content).toBeDefined()
  })

  it('handles update request with SHA check', async () => {
    let capturedInit: RequestInit | undefined

    const existingContent = serializeArticle(
      {
        title: 'Original Title',
        slug: 'update-gh',
        description: '',
        type: 'note',
        tags: [],
        publishedAt: '2026-09-01',
      },
      'Original'
    )

    const mockFetch = async (url: any, init?: RequestInit) => {
      if (!init || init.method === 'GET' || !init.method) {
        return new Response(
          JSON.stringify({
            content: Buffer.from(existingContent).toString('base64'),
            encoding: 'base64',
            sha: 'existing-sha-12345',
          }),
          { status: 200 }
        )
      }

      if (init.method === 'PUT') {
        capturedInit = init
        return new Response(JSON.stringify({ content: { name: 'update-gh.md' } }), { status: 200 })
      }

      return new Response('', { status: 200 })
    }

    const repo = new GitHubContentRepository({
      token: 'fake-token',
      owner: 'test-owner',
      repo: 'test-repo',
      fetchFn: mockFetch as any,
    })

    await repo.updateArticle({
      metadata: {
        title: 'Updated Title',
        slug: 'update-gh',
        description: 'New desc',
        type: 'note',
        tags: [],
        publishedAt: '2026-09-01',
      },
      markdown: 'Updated body',
    })

    expect(capturedInit).toBeDefined()
    const parsed = JSON.parse(String(capturedInit?.body))
    expect(parsed.sha).toBe('existing-sha-12345')
  })

  it('handles 401 Unauthorized cleanly without leaking secrets', async () => {
    const mockFetch = async () => new Response('Unauthorized', { status: 401 })

    const repo = new GitHubContentRepository({
      token: 'secret-token-xyz',
      owner: 'test-owner',
      repo: 'test-repo',
      fetchFn: mockFetch as any,
    })

    try {
      await repo.getArticle('any-slug')
      expect.unreachable()
    } catch (err: any) {
      expect(err).toBeInstanceOf(ContentRepositoryError)
      expect(err.statusCode).toBe(401)
      expect(err.message).toContain('GitHub authentication failed')
      expect(err.message).not.toContain('secret-token-xyz')
    }
  })

  it('handles 403 Rate Limit exceeded cleanly', async () => {
    const headers = new Headers({ 'x-ratelimit-remaining': '0' })
    const mockFetch = async () => new Response('Rate limit exceeded', { status: 403, headers })

    const repo = new GitHubContentRepository({
      token: 'token',
      owner: 'test-owner',
      repo: 'test-repo',
      fetchFn: mockFetch as any,
    })

    await expect(repo.getArticle('rate-limited-slug')).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining('rate limit exceeded'),
    })
  })

  it('handles 409 Conflict cleanly', async () => {
    const mockFetch = async (url: any, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return new Response(JSON.stringify({ message: 'Conflict' }), { status: 409 })
      }
      return new Response(
        JSON.stringify({
          content: Buffer.from(
            serializeArticle(
              {
                title: 'T',
                slug: 'conflict-slug',
                description: '',
                type: 'note',
                tags: [],
                publishedAt: '2026-09-01',
              },
              'B'
            )
          ).toString('base64'),
          encoding: 'base64',
          sha: 'sha-old',
        }),
        { status: 200 }
      )
    }

    const repo = new GitHubContentRepository({
      token: 'token',
      owner: 'test-owner',
      repo: 'test-repo',
      fetchFn: mockFetch as any,
    })

    await expect(
      repo.updateArticle({
        metadata: {
          title: 'T',
          slug: 'conflict-slug',
          description: '',
          type: 'note',
          tags: [],
          publishedAt: '2026-09-01',
        },
        markdown: 'B2',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('GitHub conflict'),
    })
  })

  it('handles 422 Unprocessable Entity cleanly', async () => {
    const mockFetch = async (url: any, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return new Response(JSON.stringify({ message: 'Unprocessable Entity' }), { status: 422 })
      }
      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    }

    const repo = new GitHubContentRepository({
      token: 'token',
      owner: 'test-owner',
      repo: 'test-repo',
      fetchFn: mockFetch as any,
    })

    await expect(
      repo.createArticle({
        metadata: {
          title: 'T',
          slug: 'invalid',
          description: '',
          type: 'note',
          tags: [],
          publishedAt: '2026-09-01',
        },
        markdown: 'B',
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('422'),
    })
  })
})
