import type { ApiError } from '~/types/api'

export function isApiError(err: unknown): err is { data: ApiError } {
  const candidate = err as { data?: { error?: { code?: unknown } } } | null
  return (
    candidate !== null
    && typeof candidate === 'object'
    && typeof candidate.data?.error?.code === 'string'
  )
}
