import { getFeaturedNews } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const news = await getFeaturedNews(event)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return successResponse(news)
})
