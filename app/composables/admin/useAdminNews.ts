import type { NewsDto, NewsStatus } from '~/types/news'
import type { NewsCreateInput, NewsPatchInput } from '~/utils/validators/news'
import type { ApiSuccess } from '~/types/api'

export function useAdminNews(statusFilter?: MaybeRef<NewsStatus | undefined>, categoryFilter?: MaybeRef<string | undefined>) {
  const { data, status, error, refresh } = useFetch<ApiSuccess<NewsDto[]>>(
    '/api/admin/news',
    {
      key: () => `admin-news-list-${toValue(statusFilter) ?? 'all'}-${toValue(categoryFilter) ?? 'all'}`,
      server: false,
      query: computed(() => {
        const s = toValue(statusFilter)
        const c = toValue(categoryFilter)
        return { ...(s ? { status: s } : {}), ...(c ? { category: c } : {}) }
      }),
      default: () => ({ data: [] }),
    },
  )

  const news = computed(() => data.value?.data ?? [])
  const pending = computed(() => status.value === 'pending' || status.value === 'idle')

  async function create(input: NewsCreateInput) {
    await $fetch('/api/admin/news', { method: 'POST', body: input })
    await refresh()
  }

  async function update(id: string, input: NewsPatchInput) {
    await $fetch(`/api/admin/news/${id}`, { method: 'PATCH', body: input })
    await refresh()
  }

  async function remove(id: string) {
    await $fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return { news, pending, error, refresh, create, update, remove }
}
