import type { NewsDto } from '~/types/news'
import type { ApiSuccess } from '~/types/api'

const EMPTY: ApiSuccess<NewsDto[]> = { data: [] }

export function useSimilar(articleId: MaybeRef<string>) {
  const id = toRef(articleId)

  const { data, pending, error } = useAsyncData<ApiSuccess<NewsDto[]>>(
    () => `news-similar-${id.value}`,
    async () => {
      if (!id.value) return EMPTY
      return $fetch<ApiSuccess<NewsDto[]>>(`/api/news/${id.value}/similar`)
    },
    { default: () => EMPTY, watch: [id] },
  )

  const articles = computed(() => data.value?.data ?? [])
  return { data: articles, pending, error }
}

export function useRelated(articleId: MaybeRef<string>) {
  const id = toRef(articleId)

  const { data, pending, error } = useAsyncData<ApiSuccess<NewsDto[]>>(
    () => `news-related-${id.value}`,
    async () => {
      if (!id.value) return EMPTY
      return $fetch<ApiSuccess<NewsDto[]>>(`/api/news/${id.value}/related`)
    },
    { default: () => EMPTY, watch: [id] },
  )

  const articles = computed(() => data.value?.data ?? [])
  return { data: articles, pending, error }
}

export function useForYou(sessionId: MaybeRef<string>) {
  const sid = toRef(sessionId)

  const { data, pending, error } = useAsyncData<ApiSuccess<NewsDto[]>>(
    () => `recommendations-for-you-${sid.value}`,
    async () => {
      if (!sid.value) return EMPTY
      return $fetch<ApiSuccess<NewsDto[]>>('/api/recommendations/for-you', {
        query: { sessionId: sid.value },
      })
    },
    { default: () => EMPTY, watch: [sid] },
  )

  const articles = computed(() => data.value?.data ?? [])
  return { data: articles, pending, error }
}
