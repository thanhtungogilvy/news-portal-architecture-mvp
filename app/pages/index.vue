<script setup lang="ts">
import type { ApiSuccess } from '~/types/api'
import type { CategoryDto } from '~/types/category'
import type { NewsDto } from '~/types/news'
import { estimateReadTime, formatCompactViewCount, formatNewsDate } from '~/utils/format/news'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Verdana News',
  description: 'Tin tức, phân tích và góc nhìn nổi bật về sức khỏe, khoa học và đời sống được biên tập mỗi ngày bởi Verdana News.',
})

const {
  news: featured,
  status: featuredStatus,
  error: featuredError,
} = useFeaturedNews()
const {
  news: mostViewed,
  status: mostViewedStatus,
  error: mostViewedError,
} = useMostViewedNews()

const hero = computed<NewsDto | null>(() => featured.value[0] ?? null)
const latestStories = computed<NewsDto[]>(() => featured.value.slice(1, 4))
const editorPicks = computed<NewsDto[]>(() => mostViewed.value.slice(0, 2))

const {
  data: categoryColumnsData,
  status: categoryColumnsStatus,
  error: categoryColumnsError,
} = useAsyncData(
  'home-category-columns',
  async () => {
    const catsRes = await $fetch<ApiSuccess<CategoryDto[]>>('/api/categories')
    const cats = catsRes.data.slice(0, 3)

    if (cats.length === 0) return []

    const newsArr = await Promise.all(
      cats.map((cat) =>
        $fetch<ApiSuccess<NewsDto[]>>('/api/news', {
          query: { category: cat.slug, limit: 4 },
        }),
      ),
    )

    return cats.map((cat, i) => ({
      name: cat.name,
      slug: cat.slug,
      articles: newsArr[i]?.data ?? [],
    }))
  },
  { default: () => [] as Array<{ name: string; slug: string; articles: NewsDto[] }> },
)

const categoryColumns = computed(() => categoryColumnsData.value ?? [])
const hasFeaturedError = computed(() => featuredStatus.value === 'error')
const hasMostViewedError = computed(() => mostViewedStatus.value === 'error')
const hasCategoryColumnsError = computed(() => categoryColumnsStatus.value === 'error')

// Personalized recommendations
const { sessionId } = useAnonymousSession()
const { data: forYouArticles, pending: forYouPending } = useForYou(sessionId)
</script>

<template>
  <div class="bg-slate-50 text-navy-900">
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.64fr)_minmax(320px,0.62fr)] lg:gap-10 lg:px-12 lg:py-14">
        <div class="min-w-0">
          <div class="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-600">
            <span>Ấn bản hôm nay</span>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500">Câu chuyện dẫn nhịp ngày mới</span>
          </div>

          <article
            v-if="hero"
            class="space-y-7"
          >
            <div class="space-y-5">
              <div class="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-sage-600">
                <span>{{ hero.category?.name ?? 'Nổi bật' }}</span>
                <span class="text-slate-300">•</span>
                <span class="text-slate-500">{{ formatNewsDate(hero.publishedAt) }}</span>
              </div>

              <NuxtLink :to="`/news/${hero.slug}`" class="group block">
                <h1 class="mt-2 font-vietnam text-3xl font-semibold leading-tight text-navy-900">
                  {{ hero.title }}
                </h1>
              </NuxtLink>
            </div>

            <div class="grid gap-8 border-t border-slate-200 pt-7 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
              <div class="flex min-w-0 flex-col justify-between">
                <div class="space-y-5">
                  <p
                    v-if="hero.summary"
                    class="max-w-[28rem] text-[1.08rem] leading-7 text-slate-600 sm:text-[1.18rem] sm:leading-8"
                  >
                    {{ hero.summary }}
                  </p>

                  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                    <span>{{ formatCompactViewCount(hero.viewCount) }} lượt xem</span>
                    <span class="text-slate-300">•</span>
                    <span>Đọc {{ estimateReadTime(hero.content) }} phút</span>
                    <span v-if="hero.authorName" class="text-slate-300">•</span>
                    <span v-if="hero.authorName" class="font-medium text-navy-900">{{ hero.authorName }}</span>
                  </div>

                  <p class="max-w-sm text-sm leading-6 text-slate-500">
                    Bài dẫn nhịp mở đầu cho những diễn biến, phân tích và câu chuyện đáng chú ý nhất trong ngày.
                  </p>
                </div>

                <div class="mt-8 flex flex-wrap items-center gap-4">
                  <NuxtLink
                    :to="`/news/${hero.slug}`"
                    class="inline-flex min-h-12 items-center justify-center rounded-full bg-navy-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2"
                  >
                    Đọc câu chuyện chính
                  </NuxtLink>
                  <NuxtLink
                    v-if="hero.category?.slug"
                    :to="`/categories/${hero.category.slug}`"
                    class="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-navy-900 transition-colors hover:border-sage-600/40 hover:text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2"
                  >
                    Chuyên mục {{ hero.category.name }}
                  </NuxtLink>
                </div>
              </div>

              <NuxtLink
                :to="`/news/${hero.slug}`"
                class="group block"
              >
                <div class="overflow-hidden rounded-[28px] bg-slate-200">
                  <div class="relative aspect-[4/3] bg-slate-200 sm:aspect-[16/10] lg:aspect-[16/10]">
                    <img
                      v-if="hero.thumbnailUrl"
                      :src="hero.thumbnailUrl"
                      :alt="hero.title"
                      class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    >
                    <div v-else class="absolute inset-0 bg-slate-200" />
                  </div>
                </div>
              </NuxtLink>
            </div>
          </article>

          <div
            v-else-if="featuredStatus === 'pending'"
            class="space-y-7"
          >
            <div class="space-y-5">
              <div class="h-4 w-48 rounded-full bg-slate-200" />
              <div class="h-52 w-full max-w-[52rem] rounded-[24px] bg-slate-200 sm:h-56" />
            </div>

            <div class="grid gap-8 border-t border-slate-200 pt-7 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
              <div class="space-y-5">
                <div class="h-24 rounded-[24px] bg-slate-100" />
                <div class="h-5 w-4/5 rounded bg-slate-100" />
                <div class="h-5 w-3/5 rounded bg-slate-100" />
                <div class="flex gap-3 pt-4">
                  <div class="h-12 w-40 rounded-full bg-slate-200" />
                  <div class="h-12 w-32 rounded-full bg-slate-100" />
                </div>
              </div>
              <div class="overflow-hidden rounded-[28px] bg-slate-200">
                <div class="aspect-[4/3] animate-pulse bg-slate-200 sm:aspect-[16/10] lg:aspect-[16/10]" />
              </div>
            </div>
          </div>

          <div
            v-else
            class="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center sm:px-10"
          >
            <p class="font-vietnam text-2xl font-semibold text-navy-900">
              Chưa có bài nổi bật cho trang chủ.
            </p>
            <p class="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
              Nội dung nổi bật sẽ xuất hiện ở đây sau khi ban biên tập cập nhật bài viết mới.
            </p>
            <NuxtLink
              to="/news"
              class="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-navy-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-950"
            >
              Xem toàn bộ tin tức
            </NuxtLink>
          </div>

          <p
            v-if="hasFeaturedError && featuredError"
            class="mt-4 rounded-2xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error-dark"
          >
            Không thể tải mục nổi bật lúc này. Nội dung bên dưới vẫn có thể tiếp tục truy cập.
          </p>
        </div>

        <aside class="flex min-w-0 flex-col gap-5 border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <div class="bg-white">
            <div class="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-600">
                  Bản tin nhanh
                </p>
                <h2 class="mt-2 font-vietnam text-lg font-semibold leading-tight text-navy-900">
                  Đọc tiếp trong hôm nay
                </h2>
              </div>
              <NuxtLink
                to="/news"
                class="text-sm font-medium text-slate-500 transition-colors hover:text-sage-700"
              >
                Tất cả
              </NuxtLink>
            </div>

            <div v-if="latestStories.length > 0" class="mt-2 divide-y divide-slate-200">
              <NuxtLink
                v-for="(item, index) in latestStories"
                :key="item.id"
                :to="`/news/${item.slug}`"
                class="group flex gap-4 py-4 first:pt-4 last:pb-0"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-vietnam text-sm font-semibold text-slate-500 transition-colors group-hover:bg-sage-50 group-hover:text-sage-700">
                  {{ String(index + 1).padStart(2, '0') }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-600">
                    {{ item.category?.name ?? 'Tin mới' }}
                  </p>
                  <h3 class="mt-2 font-vietnam text-lg font-semibold leading-6 text-navy-900 transition-colors group-hover:text-sage-700">
                    {{ item.title }}
                  </h3>
                  <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span>{{ formatNewsDate(item.publishedAt) }}</span>
                    <span class="text-slate-300">•</span>
                    <span>{{ formatCompactViewCount(item.viewCount) }} lượt xem</span>
                  </p>
                </div>
              </NuxtLink>
            </div>

            <div v-else-if="featuredStatus === 'pending'" class="mt-4 space-y-4">
              <div
                v-for="i in 4"
                :key="i"
                class="flex animate-pulse gap-4 border-b border-slate-200 py-4 last:border-b-0 last:pb-0"
              >
                <div class="h-10 w-10 rounded-full bg-slate-200" />
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-24 rounded bg-slate-200" />
                  <div class="h-5 rounded bg-slate-200" />
                  <div class="h-4 w-36 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500"
            >
              Chưa có thêm bài viết mới để hiển thị trong dòng tin.
            </div>
          </div>

          <!-- <div class="rounded-[24px] bg-slate-50 p-5 text-navy-900">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-600">
              Nhịp biên tập
            </p>
            <h2 class="mt-3 font-vietnam text-[1.45rem] font-semibold leading-tight">
              Theo dõi diễn biến đáng chú ý
            </h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Trang chủ ưu tiên bài mới, bài sâu và những chủ đề đang được độc giả chú ý nhất.
            </p>
            <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div class="font-vietnam text-2xl font-semibold text-navy-900">
                  {{ featured.length }}
                </div>
                <div class="mt-1 text-slate-500">
                  Bài nổi bật
                </div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div class="font-vietnam text-2xl font-semibold text-navy-900">
                  {{ editorPicks.length }}
                </div>
                <div class="mt-1 text-slate-500">
                  Bài đọc nhiều
                </div>
              </div>
            </div>
          </div> -->
        </aside>
      </div>
    </section>

    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-12 lg:py-16">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-600">
              Chuyên mục
            </p>
            <h2 class="mt-2 font-vietnam text-3xl font-semibold leading-tight text-navy-900">
              Theo dõi từng chủ đề đang được quan tâm
            </h2>
            <p class="mt-3 text-base leading-7 text-slate-500">
              Mỗi chuyên mục tập hợp các bài viết mới nhất để bạn đọc có thể quét nhanh diễn biến chính trước khi đi sâu vào từng bài.
            </p>
          </div>
          <NuxtLink
            to="/news"
            class="inline-flex min-h-12 items-center rounded-full border border-slate-200 px-5 text-sm font-medium text-navy-900 transition-colors hover:border-sage-600/40 hover:text-sage-700"
          >
            Xem toàn bộ lưu trữ
          </NuxtLink>
        </div>

        <div
          v-if="hasCategoryColumnsError && categoryColumnsError"
          class="mt-6 rounded-2xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error-dark"
        >
          Một số chuyên mục chưa thể tải lúc này. Hãy thử lại sau ít phút.
        </div>

        <div
          v-if="categoryColumns.length > 0"
          class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <article
            v-for="col in categoryColumns"
            :key="col.slug"
            class="flex h-full flex-col rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
          >
            <div class="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sage-600">
                  Chuyên mục
                </p>
                <h3 class="mt-2 font-vietnam text-2xl font-semibold text-navy-900">
                  {{ col.name }}
                </h3>
              </div>
              <NuxtLink
                :to="`/categories/${col.slug}`"
                class="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-navy-900 transition-colors hover:border-sage-600/40 hover:text-sage-700"
              >
                Xem
              </NuxtLink>
            </div>

            <div v-if="col.articles.length > 0" class="mt-2 space-y-1">
              <NuxtLink
                v-for="(article, idx) in col.articles"
                :key="article.id"
                :to="`/news/${article.slug}`"
                class="group flex gap-4 rounded-2xl px-2 py-4 transition-colors hover:bg-white"
              >
                <span class="w-8 shrink-0 pt-0.5 font-vietnam text-xl font-semibold text-slate-300 transition-colors group-hover:text-sage-600">
                  {{ String(idx + 1).padStart(2, '0') }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-vietnam text-[1.05rem] font-medium leading-6 text-navy-900 transition-colors group-hover:text-sage-700">
                    {{ article.title }}
                  </span>
                  <span class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span>{{ formatNewsDate(article.publishedAt) }}</span>
                    <span class="text-slate-300">•</span>
                    <span>Đọc {{ estimateReadTime(article.content) }} phút</span>
                  </span>
                </span>
              </NuxtLink>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm leading-6 text-slate-500"
            >
              Chuyên mục này chưa có bài viết hiển thị trên trang chủ.
            </div>
          </article>
        </div>

        <div
          v-else-if="categoryColumnsStatus === 'pending'"
          class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
          >
            <div class="animate-pulse space-y-4">
              <div class="h-3 w-24 rounded bg-slate-200" />
              <div class="h-8 w-40 rounded bg-slate-200" />
              <div class="space-y-3 pt-3">
                <div
                  v-for="j in 4"
                  :key="j"
                  class="space-y-2 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <div class="h-5 rounded bg-slate-200" />
                  <div class="h-4 w-32 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#fff_100%)]">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-12 lg:py-16">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-600">
              Đọc nhiều nhất
            </p>
            <h2 class="mt-2 font-vietnam text-3xl font-semibold leading-tight text-navy-900">
              Các bài phân tích đang giữ nhịp thảo luận
            </h2>
            <p class="mt-3 text-base leading-7 text-slate-500">
              Danh sách này ưu tiên những bài đọc được quan tâm nhiều nhất để bạn tiếp cận nhanh các chủ đề đang lan rộng.
            </p>
          </div>
          <NuxtLink
            to="/news"
            class="inline-flex min-h-12 items-center rounded-full border border-slate-200 px-5 text-sm font-medium text-navy-900 transition-colors hover:border-sage-600/40 hover:text-sage-700"
          >
            Xem kho lưu trữ
          </NuxtLink>
        </div>

        <div
          v-if="hasMostViewedError && mostViewedError"
          class="mt-6 rounded-2xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error-dark"
        >
          Không thể tải mục đọc nhiều nhất lúc này. Bạn vẫn có thể tiếp tục xem các chuyên mục và bài viết mới.
        </div>

        <div
          v-if="editorPicks.length > 0"
          class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2"
        >
          <NuxtLink
            v-for="item in editorPicks"
            :key="item.id"
            :to="`/news/${item.slug}`"
            class="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div class="relative h-60 overflow-hidden bg-slate-200 sm:h-72 lg:h-80">
              <img
                v-if="item.thumbnailUrl"
                :src="item.thumbnailUrl"
                :alt="item.title"
                class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              >
              <div v-else class="absolute inset-0 bg-slate-200" />
              <div class="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
              <div class="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700">
                {{ item.category?.name ?? 'Phân tích' }}
              </div>
            </div>

            <div class="space-y-4 p-6 sm:p-7">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                <span>{{ formatNewsDate(item.publishedAt) }}</span>
                <span class="text-slate-300">•</span>
                <span>{{ formatCompactViewCount(item.viewCount) }} lượt xem</span>
                <span class="text-slate-300">•</span>
                <span>Đọc {{ estimateReadTime(item.content) }} phút</span>
              </div>

              <h3 class="font-vietnam text-2xl font-semibold leading-[1.18] text-navy-900 transition-colors group-hover:text-sage-700 sm:text-[1.85rem]">
                {{ item.title }}
              </h3>

              <p v-if="item.summary" class="text-base leading-7 text-slate-600">
                {{ item.summary }}
              </p>

              <div class="flex items-center gap-3 pt-1">
                <img
                  v-if="item.authorAvatarUrl"
                  :src="item.authorAvatarUrl"
                  :alt="item.authorName ?? ''"
                  class="h-10 w-10 shrink-0 rounded-full object-cover"
                >
                <div v-else class="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-navy-900">
                    {{ item.authorName ?? 'Biên tập viên' }}
                  </p>
                  <p class="text-sm text-slate-500">
                    Góc nhìn được quan tâm trong ngày
                  </p>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div
          v-else-if="mostViewedStatus === 'pending'"
          class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2"
        >
          <div
            v-for="i in 2"
            :key="i"
            class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
          >
            <div class="h-80 animate-pulse bg-slate-200" />
            <div class="space-y-4 p-6 sm:p-7">
              <div class="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div class="h-16 animate-pulse rounded-2xl bg-slate-200" />
              <div class="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div class="flex items-center gap-3 pt-2">
                <div class="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-32 rounded bg-slate-200" />
                  <div class="h-4 w-40 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
        >
          <p class="font-vietnam text-2xl font-semibold text-navy-900">
            Chưa có dữ liệu đọc nhiều nhất.
          </p>
          <p class="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
            Bảng xếp hạng bài viết sẽ xuất hiện khi hệ thống có đủ lượt đọc để tổng hợp.
          </p>
        </div>
      </div>
    </section>

    <!-- ─── Personalized Recommendations ───────────────── -->
    <PersonalizedArticles :data="forYouArticles" :pending="forYouPending" />
  </div>
</template>
