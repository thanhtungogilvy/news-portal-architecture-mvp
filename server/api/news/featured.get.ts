import { getFeaturedNews } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const news = await getFeaturedNews(event)
  return successResponse(news)
})
