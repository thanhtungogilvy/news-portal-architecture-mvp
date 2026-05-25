<script setup lang="ts">
import type { ApiSuccess } from '~/types/api'
import type { NewsDto } from '~/types/news'
import { sanitizeHtml } from '~/utils/sanitize/html'
import { formatCompactViewCount, estimateReadTime } from '~/utils/format/news'
import dayjs from 'dayjs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { article, status, recordView } = useNewsDetail(slug)
const lastRecordedId = ref<string | null>(null)

watch(
  () => article.value?.id,
  (id) => {
    if (!import.meta.client || !id || lastRecordedId.value === id) return
    lastRecordedId.value = id
    void recordView(id)
  },
  { immediate: true },
)

const relatedCategorySlug = computed(() => article.value?.category?.slug ?? null)
const relatedAll = ref<NewsDto[]>([])
const relatedRequestId = ref(0)

watch(
  relatedCategorySlug,
  async (slugValue) => {
    if (import.meta.server) return

    if (!slugValue) {
      relatedAll.value = []
      return
    }

    const requestId = ++relatedRequestId.value

    try {
      const response = await $fetch<ApiSuccess<NewsDto[]>>('/api/news', {
        query: { category: slugValue, limit: 4 },
      })

      if (requestId !== relatedRequestId.value) return
      relatedAll.value = response.data ?? []
    } catch {
      if (requestId !== relatedRequestId.value) return
      relatedAll.value = []
    }
  },
  { immediate: true },
)

const related = computed(() =>
  relatedAll.value.filter(n => n.slug !== slug.value).slice(0, 3),
)

function formatLongDate(iso: string | null) {
  if (!iso) return ''
  return dayjs(iso).format('D [tháng] M, YYYY')
}

useHead({
  title: () => article.value?.title ?? 'Bài viết',
  meta: [{ name: 'description', content: () => article.value?.summary ?? '' }],
})
</script>

<template>
  <div class="bg-white">
    <!-- ─── Loading ─────────────────────────────────────── -->
    <template v-if="status === 'pending'">
      <div class="px-4 pb-10 pt-16 sm:px-6 sm:pt-20 lg:px-12 lg:pt-24">
        <div class="mx-auto max-w-[800px] space-y-5">
          <UiSkeleton class="h-4 w-48" />
          <UiSkeleton class="h-4 w-32" />
          <UiSkeleton class="mt-1 h-16 w-full sm:h-24" />
          <UiSkeleton class="h-7 w-full max-w-2xl" />
          <UiSkeleton class="h-7 w-3/4" />
          <div class="flex items-center gap-3 pt-2">
            <UiSkeleton class="size-10 shrink-0 rounded-full" />
            <div class="space-y-2">
              <UiSkeleton class="h-3.5 w-28" />
              <UiSkeleton class="h-3 w-52" />
            </div>
          </div>
        </div>
      </div>
      <div class="px-4 sm:px-6 lg:px-12">
        <UiSkeleton class="h-[280px] w-full rounded-xl sm:h-[400px] lg:h-[560px]" />
      </div>
      <div class="mx-auto max-w-[720px] space-y-4 px-4 py-12 sm:px-6 lg:px-12">
        <UiSkeleton class="h-5 w-full" />
        <UiSkeleton class="h-5 w-full" />
        <UiSkeleton class="h-5 w-11/12" />
        <UiSkeleton class="h-5 w-full" />
        <UiSkeleton class="h-5 w-4/5" />
      </div>
    </template>

    <!-- ─── Not Found ──────────────────────────────────── -->
    <div
      v-else-if="!article"
      class="px-4 py-24 sm:px-6 lg:px-12"
    >
      <div class="mx-auto max-w-[800px] rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center">
        <p class="font-vietnam font-bold text-[28px] text-navy-900 sm:text-[36px]">
          Không tìm thấy bài viết.
        </p>
        <p class="mt-3 text-[17px] leading-[1.6] text-slate-500">
          Bài viết có thể đã bị gỡ xuống, chưa xuất bản hoặc đường dẫn không còn hợp lệ.
        </p>
        <NuxtLink to="/news" class="mt-8 inline-flex">
          <UiButton variant="secondary">Quay lại bản tin</UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- ─── Article ────────────────────────────────────── -->
    <template v-else>
      <!-- Article Header -->
      <div class="px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-12 lg:pb-12 lg:pt-24">
        <div class="mx-auto max-w-[800px]">
          <!-- Breadcrumb -->
          <nav class="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-slate-400" aria-label="Breadcrumb">
            <NuxtLink to="/" class="transition-colors hover:text-navy-900">Trang chủ</NuxtLink>
            <template v-if="article.category">
              <span aria-hidden="true">›</span>
              <NuxtLink :to="`/categories/${article.category.slug}`" class="transition-colors hover:text-navy-900">
                {{ article.category.name }}
              </NuxtLink>
            </template>
          </nav>

          <!-- Category label -->
          <p class="mt-4 text-[13px] font-medium uppercase tracking-[1.6px] text-sage-600">
            {{ article.category?.name ?? 'BÀI VIẾT' }}
          </p>

          <!-- Title -->
          <h1 class="mt-3 font-vietnam font-bold text-[36px] leading-[1.1] tracking-[-0.5px] text-navy-900 sm:text-[44px] lg:text-[56px] lg:tracking-[-1.12px]">
            {{ article.title }}
          </h1>

          <!-- Summary -->
          <p v-if="article.summary" class="mt-4 text-[18px] leading-[1.6] text-slate-500 sm:text-[20px] lg:text-[22px]">
            {{ article.summary }}
          </p>

          <!-- Meta -->
          <div class="mt-6 flex items-center gap-3 pt-2">
            <div class="size-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
              <img
                v-if="article.authorAvatarUrl"
                :src="article.authorAvatarUrl"
                :alt="article.authorName ?? 'Tác giả'"
                class="size-full object-cover"
              />
              <div
                v-else
                class="flex size-full items-center justify-center bg-[#dbc7b5] text-[15px] font-semibold text-white"
              >
                {{ (article.authorName ?? 'B')[0]?.toUpperCase() }}
              </div>
            </div>
            <div>
              <p class="text-[14px] font-medium text-navy-900">
                {{ article.authorName ?? 'Biên tập viên' }}
              </p>
              <p class="mt-0.5 text-[13px] text-slate-400">
                {{ formatLongDate(article.publishedAt) }}
                · Đọc {{ estimateReadTime(article.content) }} phút
                · {{ formatCompactViewCount(article.viewCount) }} lượt xem
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Image -->
      <div v-if="article.thumbnailUrl" class="px-4 pb-6 sm:px-6 lg:px-12">
        <img
          :src="article.thumbnailUrl"
          :alt="article.title"
          class="h-[280px] w-full rounded-xl object-cover sm:h-[400px] lg:h-[560px]"
          loading="eager"
        />
      </div>

      <!-- Article Body -->
      <div class="px-4 pb-20 pt-10 sm:px-6 sm:pt-12 lg:px-12 lg:pt-14">
        <!-- eslint-disable vue/no-v-html -->
        <div
          class="article-body mx-auto max-w-[720px]"
          v-html="sanitizeHtml(article.content)"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>

      <!-- Related Articles -->
      <div v-if="related.length > 0" class="bg-slate-50 px-4 pb-24 pt-20 sm:px-6 lg:px-12">
        <!-- Section Header -->
        <div class="mb-8">
          <p class="text-[13px] font-medium uppercase tracking-[1.6px] text-slate-400">
            BÀI LIÊN QUAN
          </p>
          <p class="mt-2 font-vietnam font-bold text-[28px] leading-[1.2] tracking-[-0.48px] text-navy-900 sm:text-[32px]">
            Đọc thêm về {{ article.category?.name?.toLowerCase() ?? 'chủ đề này' }}
          </p>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="item in related"
            :key="item.id"
            :to="`/news/${item.slug}`"
            class="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
          >
            <div class="h-[200px] shrink-0 overflow-hidden bg-slate-100">
              <img
                v-if="item.thumbnailUrl"
                :src="item.thumbnailUrl"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div class="flex flex-col gap-3 px-6 pb-6 pt-5">
              <p class="text-[12px] font-medium uppercase tracking-[1.4px] text-sage-600">
                {{ item.category?.name ?? 'Tin tức' }}
              </p>
              <p class="font-vietnam font-semibold text-[20px] leading-[1.3] tracking-[-0.2px] text-navy-900 transition-colors group-hover:text-sage-600">
                {{ item.title }}
              </p>
              <p class="text-[13px] text-slate-400">
                Đọc {{ estimateReadTime(item.content) }} phút
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 700;
  color: #0f172a;
}

.article-body :deep(h2) {
  margin-top: 3rem;
  margin-bottom: 1rem;
  font-size: 2rem;
  line-height: 1.25;
  letter-spacing: -0.48px;
}

.article-body :deep(h3) {
  margin-top: 2.5rem;
  margin-bottom: 0.875rem;
  font-size: 1.5rem;
  line-height: 1.3;
  letter-spacing: -0.24px;
}

.article-body :deep(h4) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
  line-height: 1.35;
}

.article-body :deep(p) {
  margin-top: 1.5rem;
  margin-bottom: 0;
  font-size: 18px;
  line-height: 1.75;
  color: #1d293b;
}

.article-body :deep(p:first-child) {
  margin-top: 0;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin-top: 1.5rem;
  margin-bottom: 0;
  padding-left: 1.25rem;
  font-size: 18px;
  line-height: 1.75;
  color: #1d293b;
}

.article-body :deep(ul) {
  list-style: disc;
}

.article-body :deep(ul li::marker) {
  color: #059669;
}

.article-body :deep(ol) {
  list-style: decimal;
}

.article-body :deep(li) {
  margin-top: 0.5rem;
}

.article-body :deep(blockquote) {
  margin-top: 2rem;
  margin-bottom: 2rem;
  border-left: 4px solid #059669;
  padding: 0.5rem 0 0.5rem 2rem;
}

.article-body :deep(blockquote p) {
  margin-top: 0;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 500;
  font-size: 22px;
  line-height: 1.5;
  letter-spacing: -0.11px;
  color: #0f172a;
}

.article-body :deep(blockquote cite),
.article-body :deep(blockquote footer) {
  display: block;
  margin-top: 0.75rem;
  font-size: 14px;
  color: #64748b;
  font-style: normal;
}

.article-body :deep(pre) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  border-radius: 8px;
  background: #f1f5f9;
  padding: 1.25rem 1.5rem;
  font-size: 14px;
  line-height: 1.7;
}

.article-body :deep(code) {
  font-size: 0.875em;
  background: #f1f5f9;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  color: #0f172a;
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
}

.article-body :deep(a) {
  color: #059669;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.article-body :deep(a:hover) {
  color: #047857;
}

.article-body :deep(img) {
  margin-top: 2rem;
  margin-bottom: 2rem;
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.article-body :deep(hr) {
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;
  border: none;
  border-top: 1px solid #e2e8f0;
}
</style>
