import { getMostViewedNews } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const news = await getMostViewedNews(event)
  return successResponse(news)
})
