import type { NewsDto } from '~/types/news'
import type { ApiSuccess } from '~/types/api'

export function useFeaturedNews() {
  const { data, status, error } = useFetch<ApiSuccess<NewsDto[]>>('/api/news/featured', {
    key: 'news-featured',
    default: () => ({ data: [] }),
  })

  const news = computed(() => data.value?.data ?? [])

  return { news, status, error }
}
