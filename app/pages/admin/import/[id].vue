<script setup lang="ts">
import type { ImportItemStatus } from '~/types/import'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const batchId = computed(() => route.params.id as string)
const page = ref(1)
const statusFilter = ref<ImportItemStatus | undefined>(undefined)

const { batch, total, totalPages, pending, refresh } = useAdminImportBatch(batchId, page, statusFilter)

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusColor(status: ImportItemStatus | 'completed' | 'completed_with_failures'): 'warning' | 'primary' | 'success' | 'danger' {
  if (status === 'pending') return 'warning'
  if (status === 'processing') return 'primary'
  if (status === 'published' || status === 'completed') return 'success'
  return 'danger'
}

watch(statusFilter, () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <NuxtLink to="/admin/import" class="text-sm text-blue-600 hover:text-blue-500">← Quay lại import batches</NuxtLink>
        <h1 class="mt-2 text-2xl font-bold text-title">Import Batch {{ batchId.slice(0, 8) }}</h1>
        <p v-if="batch" class="mt-1 text-sm text-body">
          Category: {{ batch.category?.name ?? 'Unknown' }} · {{ batch.sourceCount }} URL(s)
        </p>
      </div>
      <UiButton variant="secondary" @click="refresh">Làm mới</UiButton>
    </div>

    <template v-if="pending && !batch">
      <div class="grid gap-4 md:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-xl bg-smoke-100" />
      </div>
    </template>

    <template v-else-if="batch">
      <div class="grid gap-4 md:grid-cols-5">
        <UiCard class="p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Status</p>
          <div class="mt-3">
            <UiBadge :color="statusColor(batch.status)">{{ batch.status }}</UiBadge>
          </div>
        </UiCard>
        <UiCard class="p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Pending</p>
          <p class="mt-3 text-3xl font-bold text-title">{{ batch.counts.pending }}</p>
        </UiCard>
        <UiCard class="p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Processing</p>
          <p class="mt-3 text-3xl font-bold text-title">{{ batch.counts.processing }}</p>
        </UiCard>
        <UiCard class="p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Published</p>
          <p class="mt-3 text-3xl font-bold text-success">{{ batch.counts.published }}</p>
        </UiCard>
        <UiCard class="p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Failed</p>
          <p class="mt-3 text-3xl font-bold text-error">{{ batch.counts.failed }}</p>
        </UiCard>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-title" for="status-filter">Filter status</label>
          <select
            id="status-filter"
            v-model="statusFilter"
            class="rounded-xl border border-border bg-white px-3 py-2 text-sm text-title outline-none transition focus:border-blue-500"
          >
            <option :value="undefined">All</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="published">published</option>
            <option value="failed">failed</option>
          </select>
        </div>
        <p class="text-sm text-body">{{ total }} item(s)</p>
      </div>

      <div class="overflow-hidden rounded-xl border border-border bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-smoke-50">
              <th class="px-5 py-3 text-left font-medium text-body">Source URL</th>
              <th class="px-5 py-3 text-left font-medium text-body">Status</th>
              <th class="px-5 py-3 text-left font-medium text-body">Attempt</th>
              <th class="px-5 py-3 text-left font-medium text-body">Published News</th>
              <th class="px-5 py-3 text-left font-medium text-body">Failure</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in batch.items"
              :key="item.id"
              class="border-b border-smoke-100 align-top last:border-b-0"
            >
              <td class="px-5 py-4">
                <a :href="item.sourceUrl" target="_blank" rel="noreferrer" class="break-all text-blue-600 hover:text-blue-500">
                  {{ item.sourceUrl }}
                </a>
                <p class="mt-1 text-xs text-body">
                  Created {{ formatDateTime(item.createdAt) }}
                </p>
              </td>
              <td class="px-5 py-4">
                <UiBadge :color="statusColor(item.status)">{{ item.status }}</UiBadge>
                <p class="mt-2 text-xs text-body">
                  Started: {{ formatDateTime(item.startedAt) }}
                </p>
                <p class="mt-1 text-xs text-body">
                  Finished: {{ formatDateTime(item.finishedAt) }}
                </p>
              </td>
              <td class="px-5 py-4 text-body">{{ item.attemptCount }}</td>
              <td class="px-5 py-4">
                <template v-if="item.news">
                  <NuxtLink :to="`/news/${item.news.slug}`" class="font-medium text-title hover:text-blue-600">
                    {{ item.news.title }}
                  </NuxtLink>
                  <p class="mt-1 text-xs text-body">{{ item.news.slug }}</p>
                </template>
                <span v-else class="text-body">—</span>
              </td>
              <td class="px-5 py-4">
                <p class="whitespace-pre-wrap text-body">{{ item.lastError ?? '—' }}</p>
              </td>
            </tr>
            <tr v-if="batch.items.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-body">Không có item nào cho bộ lọc hiện tại.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <UiButton variant="secondary" :disabled="page <= 1" @click="page--">← Trước</UiButton>
        <span class="text-sm text-body">Trang {{ page }} / {{ totalPages }}</span>
        <UiButton variant="secondary" :disabled="page >= totalPages" @click="page++">Sau →</UiButton>
      </div>
    </template>

    <div v-else class="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-body">
      Không tìm thấy import batch này.
    </div>
  </div>
</template>
