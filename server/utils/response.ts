import type { ApiSuccess } from '~/types/api'

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta !== undefined ? { data, meta } : { data }
}
