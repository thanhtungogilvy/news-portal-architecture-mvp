import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long').optional(),
  category: z.string().optional(),
}).refine(
  (data) => {
    // Only allow requests if q is provided and non-empty
    return !data.q || data.q.trim().length > 0
  },
  {
    message: 'Search query cannot be empty',
    path: ['q'],
  },
)

export type SearchQuery = z.infer<typeof searchQuerySchema>
