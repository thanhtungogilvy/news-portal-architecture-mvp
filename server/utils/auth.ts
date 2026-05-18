import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export function deriveRole(user: { app_metadata?: Record<string, unknown> }): string | null {
  return (user.app_metadata?.role as string | undefined) ?? null
}

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createApiError(401, 'UNAUTHENTICATED', 'Authentication required')
  }
  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (deriveRole(user) !== 'admin') {
    throw createApiError(403, 'FORBIDDEN', 'Admin access required')
  }
  return user
}
