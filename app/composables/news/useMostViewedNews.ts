import type { NewsDto } from '~/types/news'
import type { ApiSuccess } from '~/types/api'

export function useMostViewedNews() {
  const { data, status, error } = useFetch<ApiSuccess<NewsDto[]>>('/api/news/most-viewed', {
    key: 'news-most-viewed',
    default: () => ({ data: [] }),
  })

  const news = computed(() => data.value?.data ?? [])

  return { news, status, error }
}
