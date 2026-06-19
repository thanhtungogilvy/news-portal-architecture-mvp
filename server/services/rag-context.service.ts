import type { NewsDto } from '~/types/news'

/**
 * Strip HTML tags from a string and collapse whitespace.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Build a concatenated RAG context string from a list of articles.
 * Each article contributes one block; content is truncated to 800 chars.
 */
export function buildRagContext(articles: NewsDto[]): string {
  return articles
    .map((a) => {
      const lines: string[] = []
      lines.push(`Title: ${a.title}`)
      if (a.summary?.trim()) {
        lines.push(`Summary: ${a.summary.trim()}`)
      }
      const content = stripHtml(a.content).slice(0, 800)
      if (content) {
        lines.push(`Content: ${content}`)
      }
      return lines.join('\n')
    })
    .join('\n---\n')
}
