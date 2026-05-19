<script setup lang="ts">
import { formatCompactViewCount, formatNewsDate } from '~/utils/format/news'

definePageMeta({ layout: 'default' })

const { news: featured, status: featuredStatus } = useFeaturedNews()
const { news: mostViewed, status: mostViewedStatus } = useMostViewedNews()

const featuredLead = computed(() => featured.value[0] ?? null)
const featuredSupporting = computed(() => featured.value.slice(1, 5))
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div class="mb-10 max-w-3xl md:mb-12">
          <p class="text-[18px] font-semibold leading-[1.25] tracking-[0.1px] text-title sm:text-[21px] sm:leading-[1.19] sm:tracking-[0.231px]">
            Tin mới mỗi ngày.
          </p>
          <h1 class="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.2px] text-title sm:text-[42px] md:text-[48px] lg:text-[56px] lg:tracking-apple-tight">
            Một nhịp đọc yên tĩnh hơn cho những câu chuyện đáng chú ý nhất.
          </h1>
          <p class="mt-4 max-w-2xl text-[18px] leading-[1.55] text-title/88 sm:text-[20px] sm:font-light md:text-[21px] md:leading-[1.5]">
            Theo dõi bài dẫn, các câu chuyện tiếp nối và danh sách đang được đọc nhiều nhất trong ngày.
          </p>
        </div>

        <template v-if="featuredStatus === 'pending'">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:gap-10">
            <NewsCardSkeleton variant="lead" />
            <div class="space-y-5">
              <NewsCardSkeleton v-for="i in 4" :key="i" variant="compact" />
            </div>
          </div>
        </template>

        <template v-else-if="featuredLead">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:gap-10">
            <NewsCard :news="featuredLead" variant="lead" />

            <aside class="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 xl:pl-8">
              <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p class="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-title">
                    Theo dõi tiếp
                  </p>
                  <p class="mt-1 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
                    Các bài liên quan được xếp theo thứ tự đọc tiếp theo.
                  </p>
                </div>
                <NuxtLink to="/news" class="text-[17px] leading-[1.47] tracking-apple text-blue-600 transition-colors hover:text-blue-500">
                  Xem tất cả &gt;
                </NuxtLink>
              </div>

              <div class="space-y-5">
                <NuxtLink
                  v-for="(article, index) in featuredSupporting"
                  :key="article.id"
                  :to="`/news/${article.slug}`"
                  class="group block border-b border-border pb-5 last:border-b-0 last:pb-0"
                >
                  <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-none tracking-[-0.12px] text-[#7A7A7A]">
                    <span>{{ `0${index + 1}` }}</span>
                    <span v-if="article.category">{{ article.category.name }}</span>
                    <span v-if="article.publishedAt">{{ formatNewsDate(article.publishedAt) }}</span>
                    <span>{{ formatCompactViewCount(article.viewCount) }}</span>
                  </div>
                  <h2 class="text-[22px] font-normal leading-[1.18] tracking-[0.12px] text-title transition-colors group-hover:text-blue-600 sm:text-[24px] lg:text-[28px] lg:leading-[1.14] lg:tracking-[0.196px]">
                    {{ article.title }}
                  </h2>
                  <p v-if="article.summary" class="mt-2 line-clamp-2 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
                    {{ article.summary }}
                  </p>
                </NuxtLink>
              </div>
            </aside>
          </div>
        </template>

        <div
          v-else
          class="rounded-[18px] border border-dashed border-border bg-smoke-200 px-6 py-16 text-center"
        >
          <p class="text-[34px] font-semibold leading-[1.1] text-title">
            Chưa có bài nổi bật.
          </p>
          <p class="mt-3 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
            Khi có bài được gắn nổi bật, khu vực này sẽ mở đầu nhịp đọc trong ngày.
          </p>
        </div>
      </div>
    </section>

    <section class="bg-[#272729] text-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div class="mb-10 max-w-3xl">
          <p class="text-[18px] font-semibold leading-[1.25] tracking-[0.1px] text-white sm:text-[21px] sm:leading-[1.19] sm:tracking-[0.231px]">
            Được đọc nhiều
          </p>
          <h2 class="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.2px] text-white sm:text-[42px] md:text-[48px] lg:text-[56px] lg:tracking-apple-tight">
            Những bài viết đang thu hút nhiều sự chú ý nhất lúc này.
          </h2>
        </div>

        <div v-if="mostViewedStatus === 'pending'" class="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <NewsCardSkeleton v-for="i in 4" :key="i" variant="compact" />
        </div>

        <div v-else-if="mostViewed.length > 0" class="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <NewsCard
            v-for="article in mostViewed"
            :key="article.id"
            :news="article"
            variant="compact"
          />
        </div>

        <div
          v-else
          class="rounded-[18px] border border-white/10 bg-black/10 px-6 py-16 text-center"
        >
          <p class="text-[34px] font-semibold leading-[1.1] text-white">
            Chưa có dữ liệu lượt xem.
          </p>
          <p class="mt-3 text-[17px] leading-[1.47] tracking-apple text-white/80">
            Khu vực này sẽ hiển thị các bài đang được quan tâm nhiều nhất khi có thêm lưu lượng đọc.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
