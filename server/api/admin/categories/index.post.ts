import { categoryCreateSchema } from '~/utils/validators/category'
import { adminCreateCategory } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = categoryCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())
  }

  const category = await adminCreateCategory(event, parsed.data)
  setResponseStatus(event, 201)
  return successResponse(category)
})
