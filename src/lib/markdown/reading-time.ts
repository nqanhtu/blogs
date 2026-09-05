/**
 * Calculates reading time in minutes based on readable prose only.
 * Strips YAML frontmatter, code blocks, and markdown punctuation.
 */
export function calculateReadingTime(markdown: string, wordsPerMinute = 200): number {
  if (!markdown || !markdown.trim()) return 1

  // 1. Strip YAML frontmatter
  let clean = markdown.replace(/^---[\s\S]*?---\r?\n/, '')

  // 2. Strip fenced code blocks (```...```) and inline code
  clean = clean.replace(/```[\s\S]*?```/g, '')
  clean = clean.replace(/`[^`]*`/g, '')

  // 3. Strip HTML tags
  clean = clean.replace(/<[^>]*>/g, '')

  // 4. Strip images ![alt](url) and links [text](url) -> keep text
  clean = clean.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // 5. Strip markdown headers, blockquotes, list markers, horizontal rules
  clean = clean.replace(/^#{1,6}\s+/gm, '')
  clean = clean.replace(/^>\s+/gm, '')
  clean = clean.replace(/^[-*+]\s+/gm, '')
  clean = clean.replace(/^\d+\.\s+/gm, '')
  clean = clean.replace(/^---$/gm, '')

  // 6. Split into words
  const words = clean
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^[^a-zA-Z0-9\u00C0-\u1EF9]+$/.test(w))

  const wordCount = words.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`
}
