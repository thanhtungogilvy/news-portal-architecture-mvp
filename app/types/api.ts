export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export interface ApiSuccess<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}
