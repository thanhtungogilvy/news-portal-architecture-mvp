import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const adminClient = await serverSupabaseServiceRole(event)
  const { data, error } = await adminClient.storage
    .from('news-thumbnails')
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to list storage files')
  }

  const supabaseUrl = (useRuntimeConfig().public.supabase as { url: string }).url
  const files = (data ?? [])
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      createdAt: f.created_at ?? null,
      url: `${supabaseUrl}/storage/v1/object/public/news-thumbnails/${f.name}`,
    }))

  return successResponse(files)
})
