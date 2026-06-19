import type { ApiSuccess } from '~/types/api'

export interface ChatArticleCard {
  title: string
  slug: string
  thumbnailUrl: string | null
  summary: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  articles?: ChatArticleCard[]
  followUpQuestions?: [string, string, string]
}

interface ChatResponse {
  answer: string
  articles: ChatArticleCard[]
  followUpQuestions: [string, string, string]
}

export function useRagChat() {
  const messages = ref<ChatMessage[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function send(message: string) {
    if (!message.trim() || pending.value) return

    error.value = null

    // Append user message immediately
    messages.value.push({ role: 'user', content: message.trim() })
    pending.value = true

    try {
      const result = await $fetch<ApiSuccess<ChatResponse>>('/api/chat', {
        method: 'POST',
        body: { message: message.trim() },
      })

      messages.value.push({
        role: 'assistant',
        content: result.data.answer,
        articles: result.data.articles,
        followUpQuestions: result.data.followUpQuestions,
      })
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 503) {
        error.value = 'AI đang tạm thời không khả dụng. Vui lòng thử lại sau.'
      } else {
        error.value = 'Có lỗi xảy ra. Vui lòng thử lại.'
      }
      // Remove the user message on error so user can retry
      messages.value.pop()
    } finally {
      pending.value = false
    }
  }

  function clear() {
    messages.value = []
    error.value = null
    pending.value = false
  }

  return { messages, pending, error, send, clear }
}
