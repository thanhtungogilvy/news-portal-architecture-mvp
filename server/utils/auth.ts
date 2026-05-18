import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createApiError(401, 'UNAUTHENTICATED', 'Authentication required')
  }
  return user
}
