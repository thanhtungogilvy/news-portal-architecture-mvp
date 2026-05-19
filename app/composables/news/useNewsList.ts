import type { NewsDto } from '~/types/news'
import type { ApiSuccess } from '~/types/api'

export interface NewsListQuery {
  page?: number
  limit?: number
  category?: string
  q?: string
}

export function useNewsList(query: MaybeRef<NewsListQuery> = {}) {
  const { data, status, error, refresh } = useFetch<ApiSuccess<NewsDto[]>>('/api/news', {
    key: () => `news-list-${JSON.stringify(toValue(query))}`,
    query: computed(() => toValue(query)),
    default: () => ({ data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 0 } }),
  })

  const news = computed(() => data.value?.data ?? [])
  const total = computed(() => (data.value?.meta?.total as number) ?? 0)
  const totalPages = computed(() => (data.value?.meta?.totalPages as number) ?? 0)

  return { news, total, totalPages, status, error, refresh }
}
