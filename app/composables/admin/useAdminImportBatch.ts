import { useIntervalFn } from '@vueuse/core'
import type { ApiSuccess } from '~/types/api'
import type { ImportBatchDetailDto, ImportItemStatus } from '~/types/import'

const TERMINAL_STATUSES = ['completed', 'completed_with_failures', 'failed'] as const
const POLL_INTERVAL_MS = 5_000

export function useAdminImportBatch(
  id: MaybeRef<string>,
  page: MaybeRef<number> = 1,
  statusFilter?: MaybeRef<ImportItemStatus | undefined>,
) {
  const { data, status, error, refresh } = useFetch<ApiSuccess<ImportBatchDetailDto>>(
    () => `/api/admin/import/batches/${toValue(id)}`,
    {
      key: () => `admin-import-batch-${toValue(id)}-${toValue(page)}-${toValue(statusFilter) ?? 'all'}`,
      server: false,
      query: computed(() => ({
        page: toValue(page),
        limit: 50,
        ...(toValue(statusFilter) ? { status: toValue(statusFilter) } : {}),
      })),
    },
  )

  const batch = computed(() => data.value?.data ?? null)
  const total = computed(() => (data.value?.meta?.total as number) ?? 0)
  const totalPages = computed(() => (data.value?.meta?.totalPages as number) ?? 0)
  const pending = computed(() => status.value === 'pending' || status.value === 'idle')

  const isActive = computed(() => {
    const s = batch.value?.status
    return !s || !TERMINAL_STATUSES.includes(s as typeof TERMINAL_STATUSES[number])
  })

  const { pause, resume } = useIntervalFn(async () => {
    if (!isActive.value) { pause(); return }
    await refresh()
  }, POLL_INTERVAL_MS, { immediate: false })

  // Start polling when batch is active, stop when terminal
  watch(isActive, (active) => {
    if (active) resume()
    else pause()
  }, { immediate: true })

  return { batch, total, totalPages, pending, error, refresh }
}
