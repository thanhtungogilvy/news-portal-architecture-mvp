import { listCategories } from '../../services/category.service'

export default defineEventHandler(async (event) => {
  const categories = await listCategories(event)
  return successResponse(categories)
})
