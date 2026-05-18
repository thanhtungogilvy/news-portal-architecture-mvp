import { getNewsBySlug } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') as string
  const news = await getNewsBySlug(event, slug)
  return successResponse(news)
})
