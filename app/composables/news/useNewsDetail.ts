import type { NewsDetailDto } from '~/types/news'
import type { ApiSuccess } from '~/types/api'

export function useNewsDetail(slug: MaybeRef<string>) {
  const { data, status, error } = useFetch<ApiSuccess<NewsDetailDto>>(
    () => `/api/news/${toValue(slug)}`,
    {
      key: () => `news-detail-${toValue(slug)}`,
      watch: [() => toValue(slug)],
    },
  )

  const article = computed(() => data.value?.data ?? null)

  async function recordView(id: string) {
    if (!import.meta.client) return
    try {
      await $fetch(`/api/news/${id}/view`, { method: 'POST' })
      if (data.value?.data?.id === id) {
        data.value = {
          ...data.value,
          data: {
            ...data.value.data,
            viewCount: data.value.data.viewCount + 1,
          },
        }
      }
    }
    catch {
      // best-effort — ignore failures
    }
  }

  return { article, status, error, recordView }
}
