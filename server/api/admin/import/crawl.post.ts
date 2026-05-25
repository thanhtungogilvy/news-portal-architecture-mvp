import { importCrawlSchema } from '~/utils/validators/import'
import { adminCrawlAndCreateImportBatch } from '../../../services/import.service'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = importCrawlSchema.safeParse(body)

  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid crawl payload', parsed.error.flatten())
  }

  const result = await adminCrawlAndCreateImportBatch(event, parsed.data, user.id)
  setResponseStatus(event, 202)
  return successResponse(result)
})
