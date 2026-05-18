import { newsPatchSchema } from '~/utils/validators/news'
import { adminUpdateNews } from '../../../services/news.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = newsPatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())
  }

  const news = await adminUpdateNews(event, id, parsed.data)
  return successResponse(news)
})
