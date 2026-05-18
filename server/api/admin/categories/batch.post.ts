import type { CategoryDto } from '~/types/category'
import { z } from 'zod'
import { categoryCreateSchema } from '~/utils/validators/category'
import { insertCategory } from '../../../repositories/category.repository'

const batchSchema = z.array(categoryCreateSchema).min(1).max(50)

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const result = batchSchema.safeParse(body)

  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten())
  }

  // Sequential — stops on first conflict so no partial-success rows appear after a failure
  const created: CategoryDto[] = []
  for (const input of result.data) {
    created.push(await insertCategory(event, input))
  }

  return successResponse(created)
})
