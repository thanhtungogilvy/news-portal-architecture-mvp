<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Tìm kiếm - Verdana News',
  description: 'Tìm kiếm bài viết với công nghệ AI trên Verdana News',
})

const route = useRoute()
const router = useRouter()

const {
  query,
  results,
  pending,
  error,
  commitSearch,
} = useSemanticSearch()

// Debug mode: activated via ?debug=1 in URL
const debugMode = computed(() => route.query.debug === '1')
function toggleDebug() {
  router.replace({ query: { ...route.query, debug: debugMode.value ? undefined : '1' } })
}

// Determine error type
const isServiceUnavailable = computed(() => {
  if (!error.value) return false
  const data = (error.value as unknown as { data?: { error?: { code?: string } } }).data
  return data?.error?.code === 'AI_UNAVAILABLE'
})

const isValidationError = computed(() => {
  if (!error.value) return false
  const data = (error.value as unknown as { data?: { error?: { code?: string } } }).data
  return data?.error?.code === 'VALIDATION_ERROR'
})

// Track if user has submitted a search
const hasSearched = computed(() => query.value.trim().length > 0)

// Only show errors if user has searched (to avoid showing validation errors on empty state)
const shouldShowError = computed(() => {
  return error.value && hasSearched.value && !isValidationError.value
})

// Loading skeletons
const skeletonCount = 6
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header / Search Bar -->
    <div class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="space-y-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 sm:text-4xl">
              Tìm kiếm bài viết
            </h1>
            <p class="mt-2 text-slate-600">
              Khám phá bài viết bằng cách nhập từ khóa hoặc chủ đề quan tâm
            </p>
          </div>

          <!-- Search Input -->
          <div class="flex gap-2">
            <input
              v-model="query"
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              class="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              @keyup.enter="commitSearch"
            >
            <button
              class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              @click="commitSearch"
            >
              Tìm kiếm
            </button>
            <button
              class="rounded-lg border px-3 py-3 text-xs font-mono transition-colors"
              :class="debugMode ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'"
              :title="debugMode ? 'Tắt debug mode' : 'Bật debug mode'"
              @click="toggleDebug"
            >
              DEBUG
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Service Unavailable Error -->
      <template v-if="isServiceUnavailable && hasSearched">
        <div class="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-6">
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-orange-800">
                Tính năng tìm kiếm tạm thời không khả dụng
              </h3>
              <p class="mt-1 text-sm text-orange-700">
                Công nghệ AI của chúng tôi đang bảo trì. Vui lòng thử lại sau vài phút.
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Other Error -->
      <template v-else-if="shouldShowError">
        <div class="rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-red-800">
                Đã xảy ra lỗi
              </h3>
              <p class="mt-1 text-sm text-red-700">
                Không thể thực hiện tìm kiếm. Vui lòng thử lại.
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <template v-else-if="pending">
        <div class="space-y-4">
          <div v-for="i in skeletonCount" :key="i" class="animate-pulse rounded-lg border border-slate-200 bg-white p-4 sm:flex sm:gap-4 sm:p-3">
            <div class="h-32 w-full bg-slate-200 sm:h-24 sm:w-24 sm:shrink-0" />
            <div class="mt-4 flex-1 space-y-3 sm:mt-0">
              <div class="h-4 w-24 bg-slate-200" />
              <div class="space-y-2">
                <div class="h-5 w-full bg-slate-200" />
                <div class="h-4 w-5/6 bg-slate-200" />
              </div>
              <div class="h-4 w-20 bg-slate-200" />
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template v-else-if="hasSearched && results.length === 0">
        <div class="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-semibold text-slate-900">
            Không tìm thấy kết quả
          </h3>
          <p class="mt-2 text-slate-600">
            Hãy thử tìm kiếm với từ khóa khác hoặc nội dung chung hơn.
          </p>
        </div>
      </template>

      <!-- Results Grid -->
      <template v-else-if="results.length > 0">
        <div class="space-y-4">
          <div class="text-sm font-medium text-slate-600">
            Tìm thấy {{ results.length }} bài viết
          </div>

          <!-- ─── Debug Panel ────────────────────────────────────────── -->
          <div v-if="debugMode" class="rounded-lg border border-amber-300 bg-amber-50 p-4 font-mono text-xs">
            <div class="mb-3 flex items-center gap-2">
              <span class="rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-white">DEBUG</span>
              <span class="font-semibold text-amber-800">Relevance Breakdown — "{{ query }}"</span>
            </div>

            <div class="mb-3 grid grid-cols-4 gap-1 border-b border-amber-200 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              <span class="col-span-2">Title</span>
              <span class="text-right">Raw (pgvector)</span>
              <span class="text-right">Normalized</span>
            </div>

            <div
              v-for="(r, i) in results"
              :key="r.id"
              class="grid grid-cols-4 gap-1 border-b border-amber-100 py-1.5 last:border-0"
            >
              <span class="col-span-2 truncate text-slate-700">
                <span class="mr-1 text-amber-400">#{{ i + 1 }}</span>{{ r.title }}
              </span>

              <!-- Raw score bar -->
              <div class="flex items-center justify-end gap-1.5">
                <div class="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    class="h-full rounded-full bg-blue-400"
                    :style="{ width: `${r.rawScore * 100}%` }"
                  />
                </div>
                <span class="w-12 text-right text-slate-600">{{ (r.rawScore * 100).toFixed(1) }}%</span>
              </div>

              <!-- Normalized score bar -->
              <div class="flex items-center justify-end gap-1.5">
                <div class="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    class="h-full rounded-full"
                    :class="r.score >= 0.8 ? 'bg-green-500' : r.score >= 0.6 ? 'bg-yellow-400' : 'bg-orange-400'"
                    :style="{ width: `${r.score * 100}%` }"
                  />
                </div>
                <span class="w-12 text-right font-semibold" :class="r.score >= 0.8 ? 'text-green-700' : r.score >= 0.6 ? 'text-yellow-700' : 'text-orange-700'">
                  {{ (r.score * 100).toFixed(1) }}%
                </span>
              </div>
            </div>

            <div class="mt-3 space-y-1 border-t border-amber-200 pt-3 text-[11px] text-amber-700">
              <p><span class="font-semibold">Raw:</span> Cosine similarity từ pgvector (1 - distance). Score tuyệt đối, phụ thuộc vào model.</p>
              <p><span class="font-semibold">Normalized:</span> Raw ÷ max(raw) trong batch. Top result = 100%, còn lại tính tương đối.</p>
              <p><span class="font-semibold">Min threshold:</span> 0.35 raw — bài dưới ngưỡng này bị lọc ở DB, không trả về.</p>
            </div>
          </div>
          <!-- ─── End Debug Panel ────────────────────────────────────── -->

          <div class="space-y-3">
            <SearchResultCard
              v-for="result in results"
              :key="result.id"
              :result="result"
            />
          </div>
        </div>
      </template>

      <!-- Initial State (no search yet) -->
      <template v-else>
        <div class="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-semibold text-slate-900">
            Bắt đầu tìm kiếm
          </h3>
          <p class="mt-2 text-slate-600">
            Nhập từ khóa ở trên để tìm kiếm bài viết
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
