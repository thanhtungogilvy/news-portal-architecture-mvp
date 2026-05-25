import { importBatchListQuerySchema } from '~/utils/validators/import'
import { adminListImportBatches } from '../../../../services/import.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsed = importBatchListQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid import batch list query', parsed.error.flatten())
  }

  const { items, total } = await adminListImportBatches(event, parsed.data)
  const { page, limit } = parsed.data

  return successResponse(items, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
})
