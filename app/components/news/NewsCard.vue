<script setup lang="ts">
import clsx from 'clsx'
import type { NewsDto } from '~/types/news'
import { formatCompactViewCount, formatNewsDate } from '~/utils/format/news'

const props = withDefaults(defineProps<{
  news: NewsDto
  variant?: 'standard' | 'lead' | 'compact'
}>(), {
  variant: 'standard',
})

const wrapperClass = computed(() => clsx(
  'group block overflow-hidden transition-colors',
  {
    'border border-border bg-white rounded-[18px]': props.variant === 'standard',
    'bg-white': props.variant === 'lead',
    'border-b border-border bg-white pb-5 last:border-b-0': props.variant === 'compact',
  },
))

const imageWrapClass = computed(() => clsx(
  'overflow-hidden bg-smoke-100',
  {
    'aspect-[16/10] w-full rounded-t-[18px]': props.variant === 'standard',
    'aspect-[16/10] w-full rounded-[18px] md:aspect-[5/4] lg:aspect-[4/3]': props.variant === 'lead',
    'aspect-[4/3] w-full rounded-[18px] sm:aspect-square sm:w-28 sm:shrink-0': props.variant === 'compact',
  },
))
</script>

<template>
  <NuxtLink :to="`/news/${news.slug}`" :class="wrapperClass">
    <template v-if="variant === 'lead'">
      <article class="grid gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center xl:gap-10">
        <div :class="imageWrapClass">
          <img
            v-if="news.thumbnailUrl"
            :src="news.thumbnailUrl"
            :alt="news.title"
            class="h-full w-full object-cover shadow-product transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          >
          <div v-else class="h-full w-full bg-smoke-100" />
        </div>

        <div class="flex min-h-full flex-col justify-between gap-5 md:gap-6">
          <div class="space-y-4 md:space-y-5">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
              <UiBadge v-if="news.category" color="primary">{{ news.category.name }}</UiBadge>
              <span v-if="news.publishedAt">{{ formatNewsDate(news.publishedAt) }}</span>
              <span>{{ formatCompactViewCount(news.viewCount) }} lượt xem</span>
            </div>

            <div class="space-y-3 md:space-y-4">
              <p class="text-[18px] font-semibold leading-[1.25] tracking-[0.1px] text-title sm:text-[21px] sm:leading-[1.19] sm:tracking-[0.231px]">
                Câu chuyện chính
              </p>
              <h2 class="text-[30px] font-semibold leading-[1.08] tracking-[-0.2px] text-title sm:text-[36px] md:text-[42px] lg:text-[48px] lg:tracking-apple-tight">
                {{ news.title }}
              </h2>
              <p v-if="news.summary" class="max-w-xl text-[17px] leading-[1.55] tracking-apple text-title/90 sm:text-[19px] md:text-[21px] md:font-normal md:leading-[1.38] md:tracking-[0.1px]">
                {{ news.summary }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 md:gap-4">
            <UiButton size="md">Đọc bài viết</UiButton>
            <span class="text-[15px] leading-[1.5] tracking-apple text-blue-600 sm:text-[17px]">Khám phá thêm &gt;</span>
          </div>
        </div>
      </article>
    </template>

    <template v-else-if="variant === 'compact'">
      <article class="flex flex-col gap-4 sm:flex-row">
        <div :class="imageWrapClass">
          <img
            v-if="news.thumbnailUrl"
            :src="news.thumbnailUrl"
            :alt="news.title"
            class="h-full w-full object-cover"
            loading="lazy"
          >
          <div v-else class="h-full w-full bg-smoke-100" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-none tracking-[-0.12px] text-[#7A7A7A]">
            <span v-if="news.category">{{ news.category.name }}</span>
            <span v-if="news.publishedAt">{{ formatNewsDate(news.publishedAt) }}</span>
            <span>{{ formatCompactViewCount(news.viewCount) }}</span>
          </div>
          <h3 class="text-[19px] font-semibold leading-[1.24] tracking-[0.1px] text-title transition-colors group-hover:text-blue-600 sm:text-[21px] sm:leading-[1.19] sm:tracking-[0.231px]">
            {{ news.title }}
          </h3>
          <p v-if="news.summary" class="mt-2 line-clamp-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#333333]">
            {{ news.summary }}
          </p>
        </div>
      </article>
    </template>

    <template v-else>
      <article>
        <div :class="imageWrapClass">
          <img
            v-if="news.thumbnailUrl"
            :src="news.thumbnailUrl"
            :alt="news.title"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          >
          <div v-else class="h-full w-full bg-smoke-100" />
        </div>

        <div class="space-y-4 p-5">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] leading-none tracking-[-0.12px] text-[#7A7A7A]">
            <UiBadge v-if="news.category" color="primary">{{ news.category.name }}</UiBadge>
            <span v-if="news.publishedAt">{{ formatNewsDate(news.publishedAt) }}</span>
            <span>{{ formatCompactViewCount(news.viewCount) }}</span>
          </div>

          <h3 class="text-[24px] font-normal leading-[1.18] tracking-[0.12px] text-title transition-colors group-hover:text-blue-600 sm:text-[26px] lg:text-[28px] lg:tracking-[0.196px]">
            {{ news.title }}
          </h3>

          <p v-if="news.summary" class="line-clamp-3 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
            {{ news.summary }}
          </p>
        </div>
      </article>
    </template>
  </NuxtLink>
</template>
