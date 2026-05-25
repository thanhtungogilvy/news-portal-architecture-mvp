import { useIntervalFn } from '@vueuse/core'
import type { ApiSuccess } from '~/types/api'
import type { ImportBatchDto } from '~/types/import'

interface ImportBatchCreateInput {
  urls: string[]
  categoryId: string
}

interface ImportBatchCrawlInput {
  url: string
  categoryId: string
  maxItems: number
}

export function useAdminImportBatches(page: MaybeRef<number> = 1) {
  const { data, status, error, refresh } = useFetch<ApiSuccess<ImportBatchDto[]>>(
    '/api/admin/import/batches',
    {
      key: () => `admin-import-batches-${toValue(page)}`,
      server: false,
      query: computed(() => ({ page: toValue(page), limit: 20 })),
      default: () => ({ data: [], meta: { total: 0, totalPages: 0 } }),
    },
  )

  const batches = computed(() => data.value?.data ?? [])
  const total = computed(() => (data.value?.meta?.total as number) ?? 0)
  const totalPages = computed(() => (data.value?.meta?.totalPages as number) ?? 0)
  const pending = computed(() => status.value === 'pending' || status.value === 'idle')

  const hasActiveBatch = computed(() =>
    (data.value?.data ?? []).some(b => b.status === 'pending' || b.status === 'processing'),
  )

  const { pause, resume } = useIntervalFn(async () => {
    if (!hasActiveBatch.value) { pause(); return }
    await refresh()
  }, 5_000, { immediate: false })

  watch(hasActiveBatch, (active) => {
    if (active) resume()
    else pause()
  }, { immediate: true })

  async function create(input: ImportBatchCreateInput) {
    const response = await $fetch<ApiSuccess<{ batchId: string, accepted: number }>>('/api/admin/import/bulk', {
      method: 'POST',
      body: input,
    })
    await refresh()
    return response.data
  }

  async function crawl(input: ImportBatchCrawlInput) {
    const response = await $fetch<ApiSuccess<{ batchId: string, accepted: number, discovered: number }>>('/api/admin/import/crawl', {
      method: 'POST',
      body: input,
    })
    await refresh()
    return response.data
  }

  return { batches, total, totalPages, pending, error, refresh, create, crawl }
}
