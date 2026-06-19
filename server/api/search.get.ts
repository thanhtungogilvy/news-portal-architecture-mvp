import { searchQuerySchema } from '~/utils/validators/search'
import { semanticSearch } from '../services/semantic-search.service'

export default defineEventHandler(async (event) => {
  // Validate query parameters
  const raw = getQuery(event)
  const result = searchQuerySchema.safeParse(raw)
  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid query parameters', result.error.flatten())
  }

  const { q, category } = result.data

  // Require q to be present and non-empty for search
  if (!q || !q.trim()) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Search query is required')
  }

  try {
    // Perform semantic search
    const results = await semanticSearch(event, q, category)

    return successResponse(results)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Check if the error is due to LM Studio being unavailable
    if (message.startsWith('LM_STUDIO_UNAVAILABLE:')) {
      throw createApiError(
        503,
        'AI_UNAVAILABLE',
        'AI search is temporarily unavailable. Please try again later.',
      )
    }

    // Other errors are 500
    throw createApiError(500, 'INTERNAL_ERROR', 'Search failed', { details: message })
  }
})
