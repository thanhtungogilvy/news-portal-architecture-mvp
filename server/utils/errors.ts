import type { ApiErrorCode } from '~/types/api'

export function createApiError(
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
) {
  return createError({
    statusCode,
    data: {
      error: { code, message, details },
    },
  })
}
