/**
 * Detects non-portable ChatGPT citation artifacts such as:
 * - 【4:0†source】
 * - 【12†source】
 * - 【3:2†news.ycombinator.com】
 * - [cite: ...]
 * - (cite: ...)
 * - cite... / url... internal patterns
 */
export interface CitationDetectionResult {
  hasUnresolved: boolean
  artifacts: string[]
}

const CHATGPT_CITATION_PATTERNS = [
  /【\d+(?::\d+)?†[a-zA-Z0-9_\-\.\s]+】/g,
  /【\d+(?::\d+)?†source】/gi,
  /\[cite:[^\]]+\]/gi,
  /\(cite:[^)]+\)/gi,
  /\bcite:\s*https?:\/\/[^\s\)]+/gi,
  /[\uE200](?:cite|filecite|url)[^\uE201\n]*[\uE201]?/gi,
  /[\uE200][^\uE201\n]+[\uE201]?/g,
  /\b(?:filecite|cite|url)turn\d+[^\s\)\],]+/gi,
]

export function detectChatGPTCitations(markdown: string): CitationDetectionResult {
  if (!markdown) {
    return { hasUnresolved: false, artifacts: [] }
  }

  const artifacts: string[] = []

  for (const pattern of CHATGPT_CITATION_PATTERNS) {
    const matches = markdown.match(pattern)
    if (matches) {
      artifacts.push(...matches)
    }
  }

  const uniqueArtifacts = Array.from(new Set(artifacts))

  return {
    hasUnresolved: uniqueArtifacts.length > 0,
    artifacts: uniqueArtifacts,
  }
}

export const CHATGPT_CITATION_ERROR_MESSAGE =
  'Unresolved ChatGPT citation found. Replace it with a standard Markdown source link before publishing.'
