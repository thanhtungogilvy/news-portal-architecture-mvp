<script setup lang="ts">
import { sanitizeHtml } from '~/utils/sanitize/html'
import { formatNewsDate, formatViewCount } from '~/utils/format/news'

definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { article, status, recordView } = useNewsDetail(slug)

onMounted(() => {
  watch(
    article,
    (val) => {
      if (val?.id) {
        void recordView(val.id)
      }
    },
    { immediate: true, once: true },
  )
})
</script>

<template>
  <div class="bg-white">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <!-- Loading -->
      <template v-if="status === 'pending'">
        <div class="mx-auto max-w-4xl py-10 sm:py-14 lg:py-16">
          <UiSkeleton class="h-6 w-28 rounded-full" />
          <UiSkeleton class="mt-5 h-14 w-full max-w-4xl sm:h-20" />
          <UiSkeleton class="mt-3 h-8 w-full max-w-3xl" />
          <div class="mt-6 flex flex-wrap items-center gap-3">
            <UiSkeleton class="h-5 w-32" />
            <UiSkeleton class="h-5 w-32" />
            <UiSkeleton class="h-5 w-28" />
          </div>
          <UiSkeleton class="mt-10 aspect-[16/9] w-full rounded-[18px]" />
          <div class="mx-auto mt-12 max-w-3xl space-y-4">
            <UiSkeleton class="h-5 w-full" />
            <UiSkeleton class="h-5 w-full" />
            <UiSkeleton class="h-5 w-11/12" />
            <UiSkeleton class="h-5 w-full" />
            <UiSkeleton class="h-5 w-4/5" />
          </div>
        </div>
      </template>

    <!-- Not found -->
      <div
        v-else-if="!article"
        class="mx-auto my-12 max-w-4xl rounded-[18px] border border-dashed border-border bg-smoke-200 px-6 py-16 text-center"
      >
        <p class="text-[34px] font-semibold leading-[1.1] text-title">
          Không tìm thấy bài viết.
        </p>
        <p class="mt-3 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
          Bài viết có thể đã bị gỡ xuống, chưa xuất bản hoặc đường dẫn không còn hợp lệ.
        </p>
        <NuxtLink to="/news" class="mt-6 inline-flex">
          <UiButton variant="secondary">Quay lại bản tin</UiButton>
        </NuxtLink>
      </div>

    <!-- Article -->
      <article v-else class="py-10 sm:py-14 lg:py-16">
        <header class="mx-auto max-w-4xl border-b border-border pb-10">
          <div class="flex flex-wrap items-center gap-3">
            <UiBadge v-if="article.category" color="primary">
              {{ article.category.name }}
            </UiBadge>
            <div v-if="article.publishedAt" class="inline-flex items-center gap-1.5 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
              <IconCalendar class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{{ formatNewsDate(article.publishedAt) }}</span>
            </div>
            <div class="inline-flex items-center gap-1.5 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
              <IconEye class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{{ formatViewCount(article.viewCount) }} lượt xem</span>
            </div>
          </div>

          <h1 class="mt-5 text-[32px] font-semibold leading-[1.08] tracking-[-0.2px] text-title sm:text-[42px] md:text-[48px] lg:text-[56px] lg:tracking-apple-tight">
            {{ article.title }}
          </h1>

          <p v-if="article.summary" class="mt-5 max-w-3xl text-[20px] leading-[1.55] text-title/88 sm:text-[24px] sm:font-light md:text-[26px] lg:text-[28px] lg:leading-[1.5]">
            {{ article.summary }}
          </p>
        </header>

        <figure v-if="article.thumbnailUrl" class="mx-auto mt-8 max-w-5xl sm:mt-10">
          <img
            :src="article.thumbnailUrl"
            :alt="article.title"
            class="aspect-[16/9] w-full rounded-[18px] object-cover shadow-product"
            loading="eager"
          >
        </figure>

        <!-- eslint-disable vue/no-v-html -->
        <div
          class="article-body mx-auto mt-10 max-w-3xl text-title sm:mt-12"
          v-html="sanitizeHtml(article.content)"
        />
        <!-- eslint-enable vue/no-v-html -->

        <footer class="mx-auto mt-16 max-w-3xl border-t border-border pt-8">
          <p class="text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
            Tiếp tục theo dõi các bài viết mới trong cùng một nhịp đọc tối giản và dễ tiếp cận hơn.
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <NuxtLink to="/news" class="inline-flex">
              <UiButton>Tất cả bài viết</UiButton>
            </NuxtLink>
            <NuxtLink v-if="article.category" :to="`/categories/${article.category.slug}`" class="inline-flex">
              <UiButton variant="secondary">{{ article.category.name }}</UiButton>
            </NuxtLink>
          </div>
        </footer>
      </article>
    </div>
  </div>
</template>

<style scoped>
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  color: #1d1d1f;
  font-weight: 600;
  letter-spacing: -0.374px;
}

.article-body :deep(h2) {
  margin-top: 3rem;
  margin-bottom: 1rem;
  font-size: 1.75rem;
  line-height: 1.2;
}

.article-body :deep(h3) {
  margin-top: 2.5rem;
  margin-bottom: 0.875rem;
  font-size: 1.5rem;
  line-height: 1.25;
}

.article-body :deep(h4) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
  line-height: 1.3;
}

.article-body :deep(p),
.article-body :deep(ul),
.article-body :deep(ol),
.article-body :deep(blockquote),
.article-body :deep(pre) {
  margin-top: 1.125rem;
  margin-bottom: 1.125rem;
  font-size: 16px;
  line-height: 1.8;
  letter-spacing: -0.374px;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  padding-left: 1.4rem;
}

.article-body :deep(ul) {
  list-style: disc;
}

.article-body :deep(ol) {
  list-style: decimal;
}

.article-body :deep(li + li) {
  margin-top: 0.625rem;
}

.article-body :deep(blockquote) {
  border-left: 3px solid #0066cc;
  background: #f5f5f7;
  padding: 1.25rem 1.5rem;
  color: #1d1d1f;
}

.article-body :deep(a) {
  color: #0066cc;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.article-body :deep(pre) {
  overflow-x: auto;
  border-radius: 18px;
  background: #272729;
  padding: 1.25rem 1.5rem;
  color: #ffffff;
}

.article-body :deep(code) {
  border-radius: 8px;
  background: #f5f5f7;
  padding: 0.15rem 0.4rem;
  font-size: 0.95em;
}

.article-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.article-body :deep(img) {
  margin-top: 2rem;
  margin-bottom: 2rem;
  width: 100%;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 3px 5px 30px rgba(0, 0, 0, 0.22);
}

@media (min-width: 640px) {
  .article-body :deep(h2) {
    margin-top: 3.5rem;
    font-size: 2.125rem;
  }

  .article-body :deep(h3) {
    margin-top: 2.75rem;
    font-size: 1.75rem;
  }

  .article-body :deep(h4) {
    font-size: 1.3125rem;
  }

  .article-body :deep(p),
  .article-body :deep(ul),
  .article-body :deep(ol),
  .article-body :deep(blockquote),
  .article-body :deep(pre) {
    font-size: 17px;
    line-height: 1.85;
  }
}
</style>
