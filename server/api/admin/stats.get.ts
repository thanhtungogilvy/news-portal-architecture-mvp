import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const [
    { count: total, error: e1 },
    { count: published, error: e2 },
    { count: draft, error: e3 },
    { count: archived, error: e4 },
    { count: categories, error: e5 },
  ] = await Promise.all([
    client.from('news').select('*', { count: 'exact', head: true }),
    client.from('news').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('news').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    client.from('news').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    client.from('categories').select('*', { count: 'exact', head: true }),
  ])

  const err = e1 ?? e2 ?? e3 ?? e4 ?? e5
  if (err) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch stats')
  }

  return successResponse({
    news: {
      total: total ?? 0,
      published: published ?? 0,
      draft: draft ?? 0,
      archived: archived ?? 0,
    },
    categories: {
      total: categories ?? 0,
    },
  })
})
