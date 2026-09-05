import { ContentRepository } from './repository'
import { LocalFileContentRepository } from './local-file.repository'
import { GitHubContentRepository } from './github.repository'

export * from './repository'
export * from './local-file.repository'
export * from './github.repository'

let cachedRepository: ContentRepository | null = null

export function getContentRepository(): ContentRepository {
  if (cachedRepository) {
    return cachedRepository
  }

  const strategy = (process.env.CONTENT_REPOSITORY || 'local').toLowerCase()

  if (strategy === 'github') {
    cachedRepository = new GitHubContentRepository({
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH || 'main',
      contentDirectory: process.env.GITHUB_CONTENT_DIRECTORY || 'content/articles',
      publicSiteUrl: process.env.PUBLIC_SITE_URL,
    })
  } else {
    cachedRepository = new LocalFileContentRepository()
  }

  return cachedRepository
}

/**
 * Resets cached repository instance (useful for tests)
 */
export function resetContentRepository(): void {
  cachedRepository = null
}
