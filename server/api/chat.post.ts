import { z } from 'zod'
import { ragChat } from '../services/rag-chat.service'

const bodySchema = z.object({
  message: z.string().min(1, 'Message must not be empty'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    throw createApiError(400, 'VALIDATION_ERROR', 'message is required and must not be empty')
  }

  try {
    const chatResult = await ragChat(event, result.data.message)
    return successResponse(chatResult)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes('LM Studio is unreachable')
      || message.includes('LMSTUDIO_BASE_URL')
      || message.includes('LMSTUDIO_')
    ) {
      throw createApiError(503, 'AI_UNAVAILABLE', 'AI is temporarily unavailable. Please try again later.')
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Chat request failed', { details: message })
  }
})
