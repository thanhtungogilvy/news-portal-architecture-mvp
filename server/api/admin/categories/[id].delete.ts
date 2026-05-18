import { adminDeleteCategory } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await adminDeleteCategory(event, id)
  return successResponse(null)
})
