<script setup lang="ts">
import type { ImportBatchDto } from '~/types/import'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const page = ref(1)

// --- Mode tabs ---
const mode = ref<'bulk' | 'crawl'>('bulk')

// --- Bulk mode ---
const urlsText = ref('')
const bulkCategoryId = ref('')
const bulkSubmitting = ref(false)

const normalizedUrls = computed(() =>
  [...new Set(urlsText.value.split('\n').map((line) => line.trim()).filter(Boolean))],
)
const bulkFormError = computed(() => {
  if (!urlsText.value.trim()) return 'Nhập ít nhất một URL, mỗi dòng một URL.'
  if (!bulkCategoryId.value) return 'Chọn category đích cho batch import.'
  if (normalizedUrls.value.length > 100) return 'Tối đa 100 URL cho mỗi batch import.'
  return null
})

// --- Crawl mode ---
const crawlUrl = ref('')
const crawlCategoryId = ref('')
const crawlMaxItems = ref(20)
const crawlSubmitting = ref(false)

const crawlFormError = computed(() => {
  if (!crawlUrl.value.trim()) return 'Nhập URL trang danh sách (VD: https://vnexpress.net/kinh-doanh).'
  if (!crawlCategoryId.value) return 'Chọn category đích.'
  if (crawlMaxItems.value < 1 || crawlMaxItems.value > 100) return 'Max items: 1–100.'
  return null
})

// --- Shared ---
const { categories, pending: categoriesPending } = useAdminCategories()
const { batches, total, totalPages, pending, create, crawl, refresh } = useAdminImportBatches(page)
const { show } = useAdminToast()

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusColor(status: ImportBatchDto['status']): 'warning' | 'primary' | 'success' | 'danger' {
  if (status === 'pending') return 'warning'
  if (status === 'processing') return 'primary'
  if (status === 'completed') return 'success'
  return 'danger'
}

async function onBulkSubmit() {
  if (bulkFormError.value) { show(bulkFormError.value, 'error'); return }
  bulkSubmitting.value = true
  try {
    const result = await create({ urls: normalizedUrls.value, categoryId: bulkCategoryId.value })
    urlsText.value = ''
    show(`Batch accepted: ${result.accepted} URL(s).`, 'success')
    await router.push(`/admin/import/${result.batchId}`)
  } catch {
    show('Failed to create import batch.', 'error')
  } finally {
    bulkSubmitting.value = false
  }
}

async function onCrawlSubmit() {
  if (crawlFormError.value) { show(crawlFormError.value, 'error'); return }
  crawlSubmitting.value = true
  try {
    const result = await crawl({
      url: crawlUrl.value.trim(),
      categoryId: crawlCategoryId.value,
      maxItems: crawlMaxItems.value,
    })
    crawlUrl.value = ''
    show(`Crawled ${result.discovered} links → accepted ${result.accepted} URL(s).`, 'success')
    await router.push(`/admin/import/${result.batchId}`)
  } catch {
    show('Failed to crawl page. Check URL or try again.', 'error')
  } finally {
    crawlSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-title">Bulk Import</h1>
        <p class="mt-1 text-sm text-body">Submit article URLs manually or crawl a listing page.</p>
      </div>
      <UiButton variant="secondary" @click="refresh">Làm mới</UiButton>
    </div>

    <!-- Mode tabs -->
    <div class="flex gap-1 rounded-xl border border-border bg-smoke-200 p-1 w-fit">
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="mode === 'bulk' ? 'bg-white text-title shadow-sm' : 'text-body hover:text-title'"
        @click="mode = 'bulk'"
      >
        Bulk URLs
      </button>
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="mode === 'crawl' ? 'bg-white text-title shadow-sm' : 'text-body hover:text-title'"
        @click="mode = 'crawl'"
      >
        Crawl Page
      </button>
    </div>

    <!-- Bulk mode -->
    <UiCard v-if="mode === 'bulk'" class="p-6">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <label class="mb-2 block text-sm font-medium text-title">Source URLs</label>
          <textarea
            v-model="urlsText"
            rows="12"
            class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-title outline-none transition focus:border-blue-500"
            placeholder="https://example.com/article-1&#10;https://example.com/article-2"
          />
          <div class="mt-2 flex items-center justify-between text-xs text-body">
            <span>Mỗi dòng một URL. Tự động loại dòng trống và URL trùng.</span>
            <span>{{ normalizedUrls.length }} / 100</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-title">Target Category</label>
            <select
              v-model="bulkCategoryId"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-title outline-none transition focus:border-blue-500"
              :disabled="categoriesPending"
            >
              <option value="">Chọn category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="rounded-xl border border-smoke-200 bg-smoke-50 p-4 text-sm text-body">
            <p class="font-medium text-title">Batch preview</p>
            <p class="mt-2">Accepted URLs: {{ normalizedUrls.length }}</p>
            <p class="mt-1">Category: {{ categories.find(c => c.id === bulkCategoryId)?.name ?? 'Chưa chọn' }}</p>
          </div>

          <p v-if="bulkFormError" class="text-sm text-error-dark">{{ bulkFormError }}</p>

          <UiButton class="w-full" :disabled="bulkSubmitting || !!bulkFormError" @click="onBulkSubmit">
            {{ bulkSubmitting ? 'Đang tạo batch...' : 'Create Import Batch' }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Crawl mode -->
    <UiCard v-else class="p-6">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-title">Listing Page URL</label>
            <input
              v-model="crawlUrl"
              type="url"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-title outline-none transition focus:border-blue-500"
              placeholder="https://vnexpress.net/kinh-doanh"
            >
            <p class="mt-2 text-xs text-body">URL của trang danh sách bài viết. Server sẽ tự crawl và tìm link article.</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-title">
              Max articles
              <span class="ml-1 font-normal text-body">(1–100)</span>
            </label>
            <input
              v-model.number="crawlMaxItems"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-title outline-none transition focus:border-blue-500"
            >
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-title">Target Category</label>
            <select
              v-model="crawlCategoryId"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-title outline-none transition focus:border-blue-500"
              :disabled="categoriesPending"
            >
              <option value="">Chọn category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="rounded-xl border border-smoke-200 bg-smoke-50 p-4 text-sm text-body">
            <p class="font-medium text-title">Crawl preview</p>
            <p class="mt-2">Tối đa: {{ crawlMaxItems }} bài</p>
            <p class="mt-1">Category: {{ categories.find(c => c.id === crawlCategoryId)?.name ?? 'Chưa chọn' }}</p>
            <p class="mt-3 text-xs text-body/70">Server sẽ fetch trang, tìm article links, và tạo batch tự động.</p>
          </div>

          <p v-if="crawlFormError" class="text-sm text-error-dark">{{ crawlFormError }}</p>

          <UiButton class="w-full" :disabled="crawlSubmitting || !!crawlFormError" @click="onCrawlSubmit">
            {{ crawlSubmitting ? 'Đang crawl trang...' : 'Crawl & Create Batch' }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Batch list -->
    <div>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-title">Import Batches</h2>
          <p class="mt-1 text-sm text-body">{{ total }} batch</p>
        </div>
      </div>

      <div v-if="pending" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-xl bg-smoke-100" />
      </div>

      <div v-else-if="batches.length === 0" class="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-body">
        Chưa có import batch nào.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-border bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-smoke-50">
              <th class="px-5 py-3 text-left font-medium text-body">Batch</th>
              <th class="px-5 py-3 text-left font-medium text-body">Category</th>
              <th class="px-5 py-3 text-left font-medium text-body">Progress</th>
              <th class="px-5 py-3 text-left font-medium text-body">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="batch in batches"
              :key="batch.id"
              class="cursor-pointer border-b border-smoke-100 last:border-b-0 hover:bg-smoke-50"
              @click="router.push(`/admin/import/${batch.id}`)"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <UiBadge :color="statusColor(batch.status)">{{ batch.status }}</UiBadge>
                  <div>
                    <p class="font-medium text-title">{{ batch.id.slice(0, 8) }}</p>
                    <p class="text-xs text-body">{{ batch.sourceCount }} URL(s)</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-title">{{ batch.category?.name ?? 'Unknown' }}</td>
              <td class="px-5 py-4 text-body">
                P {{ batch.counts.pending }} ·
                Proc {{ batch.counts.processing }} ·
                Pub {{ batch.counts.published }} ·
                F {{ batch.counts.failed }}
              </td>
              <td class="px-5 py-4 text-body">{{ formatDate(batch.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
        <UiButton variant="secondary" :disabled="page <= 1" @click="page--">← Trước</UiButton>
        <span class="text-sm text-body">Trang {{ page }} / {{ totalPages }}</span>
        <UiButton variant="secondary" :disabled="page >= totalPages" @click="page++">Sau →</UiButton>
      </div>
    </div>
  </div>
</template>
