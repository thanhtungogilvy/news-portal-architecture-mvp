import { importBulkCreateSchema } from '~/utils/validators/import'
import { adminCreateImportBatch } from '../../../services/import.service'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = importBulkCreateSchema.safeParse(body)

  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid import batch payload', parsed.error.flatten())
  }

  const result = await adminCreateImportBatch(event, parsed.data, user.id)
  setResponseStatus(event, 202)
  return successResponse(result)
})
