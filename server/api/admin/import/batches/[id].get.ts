import { z } from 'zod'
import { importBatchDetailQuerySchema } from '~/utils/validators/import'
import { adminGetImportBatchById } from '../../../../services/import.service'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsedParams = paramsSchema.safeParse({
    id: getRouterParam(event, 'id'),
  })
  if (!parsedParams.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid import batch id', parsedParams.error.flatten())
  }

  const parsedQuery = importBatchDetailQuerySchema.safeParse(getQuery(event))
  if (!parsedQuery.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid import batch detail query', parsedQuery.error.flatten())
  }

  const { batch, totalItems } = await adminGetImportBatchById(event, parsedParams.data.id, parsedQuery.data)
  const { page, limit } = parsedQuery.data

  return successResponse(batch, {
    total: totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit),
  })
})
