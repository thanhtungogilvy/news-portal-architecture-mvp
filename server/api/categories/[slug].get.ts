import { getCategoryBySlug } from '../../services/category.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') as string
  const category = await getCategoryBySlug(event, slug)
  return successResponse(category)
})
