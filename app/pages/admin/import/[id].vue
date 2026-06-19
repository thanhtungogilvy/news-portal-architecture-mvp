<script setup lang="ts">
import clsx from 'clsx'
import type { ImportItemStatus, ImportBatchStatus } from '~/types/import'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const batchId = computed(() => route.params.id as string)
const page = ref(1)
const statusFilter = ref<ImportItemStatus | undefined>(undefined)

const { batch, total, totalPages, pending, refresh } = useAdminImportBatch(batchId, page, statusFilter)

// Live polling indicator
const TERMINAL_STATUSES: ImportBatchStatus[] = ['completed', 'completed_with_failures', 'failed']
const isActive = computed(() => !!batch.value && !TERMINAL_STATUSES.includes(batch.value.status))

// Segmented progress bar — each segment as % of sourceCount
const progressSegments = computed(() => {
  if (!batch.value || !batch.value.sourceCount) {
    return { published: 0, failed: 0, processing: 0 }
  }
  const { published, failed, processing } = batch.value.counts
  const t = batch.value.sourceCount
  return {
    published: (published / t) * 100,
    failed: (failed / t) * 100,
    processing: (processing / t) * 100,
  }
})

const publishedPercent = computed(() => {
  if (!batch.value?.sourceCount) return 0
  return Math.round((batch.value.counts.published / batch.value.sourceCount) * 100)
})

const FILTER_TABS: { label: string, value: ImportItemStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Published', value: 'published' },
  { label: 'Skipped', value: 'skipped' },
  { label: 'Failed', value: 'failed' },
]

function tabClass(tab: ImportItemStatus | undefined) {
  const active = statusFilter.value === tab
  return clsx(
    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
    active ? 'bg-title text-white' : 'text-body hover:bg-smoke-200',
  )
}

function batchStatusClass(status: ImportBatchStatus) {
  return clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide', {
    'bg-warning-light text-warning-dark': status === 'pending',
    'bg-blue-50 text-blue-700': status === 'processing',
    'bg-success-light text-success-dark': status === 'completed',
    'bg-error-light text-error-dark': status === 'completed_with_failures' || status === 'failed',
  })
}

function stepDotClass(state: 'done' | 'active' | 'idle') {
  return clsx('inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors', {
    'bg-smoke-200 text-body': state === 'done',
    'animate-pulse bg-blue-100 text-blue-700': state === 'active',
    'bg-smoke-100 text-smoke-400': state === 'idle',
  })
}

function formatTimeAgo(iso: string | null) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

watch(statusFilter, () => { page.value = 1 })
</script>

<template>
  <div class="space-y-6">
    <!-- ─── Header ──────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <NuxtLink
          to="/admin/import"
          class="inline-flex items-center gap-1 text-sm text-body hover:text-title"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Import Batches
        </NuxtLink>

        <div class="mt-2 flex items-center gap-3">
          <h1 class="text-xl font-semibold text-title">
            Batch <span class="font-mono text-base">{{ batchId.slice(0, 8) }}</span>
          </h1>

          <!-- Live pulsing indicator OR terminal badge -->
          <template v-if="batch">
            <span v-if="isActive" class="inline-flex items-center gap-1.5 text-xs text-blue-600">
              <span class="relative flex size-2">
                <span class="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-blue-500" />
              </span>
              Live
            </span>
            <span v-else :class="batchStatusClass(batch.status)">
              <svg v-if="batch.status === 'completed'" class="size-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else-if="batch.status !== 'pending'" class="size-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ batch.status.replace(/_/g, ' ') }}
            </span>
          </template>
        </div>

        <p v-if="batch" class="mt-1 text-sm text-body">
          {{ batch.category?.name ?? 'Unknown category' }}
          &nbsp;·&nbsp;{{ batch.sourceCount }} URL(s)
          &nbsp;·&nbsp;tạo {{ formatTimeAgo(batch.createdAt) }}
        </p>
      </div>

      <UiButton variant="secondary" size="sm" @click="refresh">
        <svg class="mr-1.5 size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Làm mới
      </UiButton>
    </div>

    <!-- ─── Skeleton ─────────────────────────────────────────────── -->
    <template v-if="pending && !batch">
      <div class="h-28 animate-pulse rounded-xl bg-smoke-100" />
      <div class="h-64 animate-pulse rounded-xl bg-smoke-100" />
    </template>

    <template v-else-if="batch">
      <!-- ─── Progress card ────────────────────────────────────────── -->
      <div class="rounded-xl border border-border bg-white p-5">
        <!-- Segmented bar -->
        <div class="flex h-2 w-full overflow-hidden rounded-full bg-smoke-200">
          <div
            class="h-full bg-success transition-[width] duration-700"
            :style="{ width: `${progressSegments.published}%` }"
          />
          <div
            class="h-full bg-error transition-[width] duration-700"
            :style="{ width: `${progressSegments.failed}%` }"
          />
          <div
            class="h-full animate-pulse bg-blue-400 transition-[width] duration-700"
            :style="{ width: `${progressSegments.processing}%` }"
          />
        </div>

        <!-- Stats row -->
        <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div class="flex items-center gap-2.5">
            <span class="size-2.5 shrink-0 rounded-full bg-success" />
            <div>
              <p class="text-xl font-semibold leading-none text-title">{{ batch.counts.published }}</p>
              <p class="mt-1 text-[11px] text-body">Published &mdash; {{ publishedPercent }}%</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="size-2.5 shrink-0 rounded-full bg-smoke-400" />
            <div>
              <p class="text-xl font-semibold leading-none text-title">{{ batch.counts.skipped }}</p>
              <p class="mt-1 text-[11px] text-body">Skipped (dedup)</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="size-2.5 shrink-0 rounded-full bg-error" />
            <div>
              <p class="text-xl font-semibold leading-none text-title">{{ batch.counts.failed }}</p>
              <p class="mt-1 text-[11px] text-body">Failed</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="size-2.5 shrink-0 rounded-full bg-blue-400" :class="{ 'animate-pulse': isActive }" />
            <div>
              <p class="text-xl font-semibold leading-none text-title">{{ batch.counts.processing }}</p>
              <p class="mt-1 text-[11px] text-body">Processing</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Filter tabs + count ──────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1 rounded-xl bg-smoke-100 p-1">
          <button
            v-for="tab in FILTER_TABS"
            :key="String(tab.value)"
            :class="tabClass(tab.value)"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="tab.value === 'failed' && batch.counts.failed > 0"
              class="ml-1 rounded-full bg-error px-1.5 py-0.5 text-[9px] font-bold text-white"
            >
              {{ batch.counts.failed }}
            </span>
            <span
              v-if="tab.value === 'skipped' && batch.counts.skipped > 0"
              class="ml-1 rounded-full bg-smoke-400 px-1.5 py-0.5 text-[9px] font-bold text-white"
            >
              {{ batch.counts.skipped }}
            </span>
          </button>
        </div>
        <p class="text-xs text-body">{{ total }} item(s)</p>
      </div>

      <!-- ─── Item table ────────────────────────────────────────────── -->
      <div class="overflow-hidden rounded-xl border border-border bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-smoke-100">
              <th class="w-8 px-4 py-3 text-left text-xs font-medium text-body">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-body">URL nguồn</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-body">Tiến trình</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-body">Kết quả</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-body">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in batch.items"
              :key="item.id"
              class="border-b border-smoke-100 align-top last:border-b-0"
            >
              <!-- # -->
              <td class="px-4 py-4 text-xs text-body">
                {{ (page - 1) * 50 + index + 1 }}
              </td>

              <!-- URL -->
              <td class="max-w-[200px] px-4 py-4">
                <a
                  :href="item.sourceUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="block truncate text-xs text-blue-600 hover:underline"
                  :title="item.sourceUrl"
                >
                  {{ item.sourceUrl.replace(/^https?:\/\//, '') }}
                </a>
                <p v-if="item.attemptCount > 1" class="mt-1 text-[11px] text-warning-dark">
                  {{ item.attemptCount }}× attempt
                </p>
              </td>

              <!-- Step flow: 1 → 2 → ✓/✗ -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-1">
                  <!-- Step 1: Queued (always done) -->
                  <span :class="stepDotClass('done')" title="Queued">1</span>

                  <span class="h-px w-3 bg-smoke-300" />

                  <!-- Step 2: Scraping -->
                  <span
                    :class="stepDotClass(
                      item.status === 'processing' ? 'active'
                      : item.startedAt ? 'done'
                      : 'idle'
                    )"
                    title="Scraping"
                  >2</span>

                  <span class="h-px w-3 bg-smoke-300" />

                  <!-- Step 3: Result -->
                  <span
                    :class="clsx(
                      'inline-flex size-5 items-center justify-center rounded-full transition-colors',
                      item.status === 'published' ? 'bg-success-light text-success-dark'
                      : item.status === 'skipped' ? 'bg-smoke-200 text-body'
                      : item.status === 'failed' ? 'bg-error-light text-error-dark'
                      : 'bg-smoke-100 text-smoke-400'
                    )"
                    title="Result"
                  >
                    <svg v-if="item.status === 'published'" class="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <!-- Skipped: dash/minus icon -->
                    <svg v-else-if="item.status === 'skipped'" class="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="item.status === 'failed'" class="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    <span v-else class="text-[10px] font-semibold">3</span>
                  </span>
                </div>

                <!-- Status badge -->
                <div class="mt-2">
                  <UiBadge
                    :color="
                      item.status === 'pending' ? 'warning'
                      : item.status === 'processing' ? 'primary'
                      : item.status === 'published' ? 'success'
                      : item.status === 'skipped' ? 'default'
                      : 'danger'
                    "
                  >{{ item.status }}</UiBadge>
                </div>
              </td>

              <!-- Result: published article OR error -->
              <td class="max-w-[200px] px-4 py-4">
                <template v-if="item.news">
                  <NuxtLink
                    :to="`/news/${item.news.slug}`"
                    class="block truncate text-xs font-medium text-title hover:text-blue-600"
                    :title="item.news.title"
                  >
                    {{ item.news.title }}
                  </NuxtLink>
                  <p class="mt-0.5 truncate text-[11px] text-body">{{ item.news.slug }}</p>
                </template>
                <p
                  v-else-if="item.lastError"
                  class="line-clamp-3 text-xs text-error-dark"
                  :title="item.lastError"
                >
                  {{ item.lastError }}
                </p>
                <span v-else class="text-xs text-body">—</span>
              </td>

              <!-- Timing -->
              <td class="px-4 py-4 text-right">
                <p v-if="item.finishedAt" class="text-[11px] text-body">{{ formatTimeAgo(item.finishedAt) }}</p>
                <p v-else-if="item.startedAt" class="text-[11px] text-blue-600">đang xử lý…</p>
                <p v-else class="text-[11px] text-body">{{ formatTimeAgo(item.createdAt) }}</p>
              </td>
            </tr>

            <tr v-if="batch.items.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-sm text-body">
                Không có item nào cho bộ lọc hiện tại.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Pagination ────────────────────────────────────────────── -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <UiButton variant="secondary" size="sm" :disabled="page <= 1" @click="page--">← Trước</UiButton>
        <span class="text-xs text-body">Trang {{ page }} / {{ totalPages }}</span>
        <UiButton variant="secondary" size="sm" :disabled="page >= totalPages" @click="page++">Sau →</UiButton>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-sm text-body">
      Không tìm thấy import batch này.
    </div>
  </div>
</template>
