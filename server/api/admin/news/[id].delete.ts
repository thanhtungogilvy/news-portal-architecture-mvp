import { adminDeleteNews } from '../../../services/news.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await adminDeleteNews(event, id)
  return successResponse(null)
})
