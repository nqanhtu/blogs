/**
 * Removes Vietnamese diacritics and converts to standard Latin characters.
 */
export function removeVietnameseDiacritics(str: string): string {
  let result = str
    // Normalize unicode
    .normalize('NFD')
    // Remove diacritical marks
    .replace(/[\u0300-\u036f]/g, '')
    // Handle specific Vietnamese consonants/characters
    .replace(/[đĐ]/g, 'd')

  // Additional explicit replacements for special Vietnamese characters if not caught by NFD
  const vietnameseMap: Record<string, string> = {
    à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a', â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩn: 'an', ẫ: 'a', ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
    è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e', ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
    ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
    ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o', ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o', ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
    ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u', ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
    ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
    Đ: 'd', đ: 'd',
  }

  for (const [key, val] of Object.entries(vietnameseMap)) {
    result = result.replaceAll(key, val)
  }

  return result
}

/**
 * Generates an SEO and URL-safe slug supporting English and Vietnamese strings.
 * Example: "Lexical Environment trong JavaScript" -> "lexical-environment-trong-javascript"
 */
export function generateSlug(input: string): string {
  if (!input || typeof input !== 'string') return ''

  const latinized = removeVietnameseDiacritics(input)
  return latinized
    .toLowerCase()
    .trim()
    // Replace punctuation and whitespace with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse consecutive hyphens
    .replace(/-+/g, '-')
    // Trim leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/**
 * Validates whether a slug matches URL-safe kebab-case format.
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
