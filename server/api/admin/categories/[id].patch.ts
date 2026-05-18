import { categoryPatchSchema } from '~/utils/validators/category'
import { adminUpdateCategory } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = categoryPatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())
  }

  const category = await adminUpdateCategory(event, id, parsed.data)
  return successResponse(category)
})
