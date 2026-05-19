import { newsletterSubscribeSchema } from '~/utils/validators/newsletter'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = newsletterSubscribeSchema.safeParse(body)

  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Email không hợp lệ', result.error.flatten())
  }

  const client = await serverSupabaseServiceRole(event)
  const { error } = await client
    .from('newsletter_subscribers')
    .insert({ email: result.data.email })

  if (error) {
    // Duplicate — already subscribed; return success silently to avoid email enumeration
    if (error.code === '23505') {
      return successResponse({ subscribed: true })
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Không thể đăng ký. Vui lòng thử lại.')
  }

  return successResponse({ subscribed: true })
})
