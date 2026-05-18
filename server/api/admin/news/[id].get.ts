import { adminGetNewsById } from '../../../services/news.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const news = await adminGetNewsById(event, id)
  return successResponse(news)
})
