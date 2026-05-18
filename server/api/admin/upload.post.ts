import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file')

  if (!filePart?.data || !filePart.filename) {
    throw createApiError(422, 'VALIDATION_ERROR', 'No file provided')
  }

  if (!filePart.type?.startsWith('image/')) {
    throw createApiError(422, 'VALIDATION_ERROR', 'File must be an image')
  }

  if (filePart.data.length > MAX_SIZE) {
    throw createApiError(422, 'VALIDATION_ERROR', 'File exceeds 5 MB limit')
  }

  const timestamp = Date.now()
  const random = Math.random().toString(16).slice(2, 6)
  const filename = `${timestamp}-${random}.webp`

  const adminClient = await serverSupabaseServiceRole(event)
  const { error } = await adminClient.storage
    .from('news-thumbnails')
    .upload(filename, filePart.data, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to upload image')
  }

  const supabaseUrl = (useRuntimeConfig().public.supabase as { url: string }).url
  const url = `${supabaseUrl}/storage/v1/object/public/news-thumbnails/${filename}`

  return successResponse({ url })
})
