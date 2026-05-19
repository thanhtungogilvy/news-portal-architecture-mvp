import { getNewsBySlug } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') as string
  const news = await getNewsBySlug(event, slug)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return successResponse({ ...news, content: sanitizeNewsContent(news.content) })
})
