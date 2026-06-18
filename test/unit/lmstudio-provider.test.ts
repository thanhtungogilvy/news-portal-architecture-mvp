import { afterEach, describe, expect, it, vi } from 'vitest'
import { chat, embed } from '../../server/services/ai/lmstudio.provider'

const ENV_KEYS = ['LMSTUDIO_BASE_URL', 'LMSTUDIO_EMBEDDING_MODEL', 'LMSTUDIO_CHAT_MODEL', 'AI_DEBUG'] as const
const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map(key => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>

describe('lmstudio provider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    for (const key of ENV_KEYS) {
      process.env[key] = ORIGINAL_ENV[key]
    }
  })

  it('throws a clear error when base url is missing', async () => {
    process.env.LMSTUDIO_EMBEDDING_MODEL = 'embed-model'
    process.env.LMSTUDIO_CHAT_MODEL = 'chat-model'

    await expect(embed('hello')).rejects.toThrow('LMSTUDIO_BASE_URL is not set')
  })

  it('throws when lm studio host is unreachable', async () => {
    process.env.LMSTUDIO_BASE_URL = 'http://localhost:1234'
    process.env.LMSTUDIO_EMBEDDING_MODEL = 'embed-model'

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')))

    await expect(embed('hello')).rejects.toThrow('LM Studio is unreachable')
  })

  it('returns embedding vector on success', async () => {
    process.env.LMSTUDIO_BASE_URL = 'http://localhost:1234'
    process.env.LMSTUDIO_EMBEDDING_MODEL = 'embed-model'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    }))

    await expect(embed('hello')).resolves.toEqual([0.1, 0.2, 0.3])
  })

  it('returns assistant content for chat on success', async () => {
    process.env.LMSTUDIO_BASE_URL = 'http://localhost:1234'
    process.env.LMSTUDIO_CHAT_MODEL = 'chat-model'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'answer' } }] }),
    }))

    await expect(chat([{ role: 'user', content: 'q' }])).resolves.toBe('answer')
  })
})
