import { adminGetCategoryById } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const category = await adminGetCategoryById(event, id)
  return successResponse(category)
})
