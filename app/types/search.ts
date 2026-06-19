export interface SearchResult {
  id: string
  title: string
  slug: string
  summary: string | null
  thumbnailUrl: string | null
  category: string | null
  /** Normalized score (0-1): score relative to top result in this batch */
  score: number
  /** Raw cosine similarity from pgvector (0-1) */
  rawScore: number
}
