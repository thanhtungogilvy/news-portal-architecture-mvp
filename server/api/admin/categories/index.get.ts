import { adminListCategories } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const categories = await adminListCategories(event)
  return successResponse(categories)
})
