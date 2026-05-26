/**
 * Generate a URL-safe slug from a (possibly Vietnamese) title.
 * Strips diacritics, converts đ/Đ, and produces a kebab-case ASCII string.
 */
export function generateSlug(title: string): string {
  const base = title
    .replace(/[Đ]/g, 'D')
    .replace(/[đ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)

  return base || 'article'
}
