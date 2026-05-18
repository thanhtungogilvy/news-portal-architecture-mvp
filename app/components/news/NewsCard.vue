<script setup lang="ts">
import type { NewsDto } from '~/types/news'
import { formatCompactViewCount, formatNewsDate } from '~/utils/format/news'

defineProps<{
  news: NewsDto
}>()
</script>

<template>
  <NuxtLink :to="`/news/${news.slug}`" class="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
    <div class="aspect-video w-full overflow-hidden bg-smoke-200">
      <img
        v-if="news.thumbnailUrl"
        :src="news.thumbnailUrl"
        :alt="news.title"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="h-full w-full bg-smoke-300" />
    </div>
    <div class="flex flex-1 flex-col gap-3 p-4">
      <div class="flex flex-wrap items-center gap-2">
        <UiBadge v-if="news.category" color="primary">
          {{ news.category.name }}
        </UiBadge>
        <div v-if="news.publishedAt" class="inline-flex items-center gap-1 text-xs text-body">
          <IconCalendar class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{{ formatNewsDate(news.publishedAt) }}</span>
        </div>
        <div class="inline-flex items-center gap-1 text-xs text-body">
          <IconEye class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{{ formatCompactViewCount(news.viewCount) }}</span>
        </div>
      </div>
      <h3 class="line-clamp-2 text-base font-semibold leading-snug text-title transition-colors group-hover:text-blue">
        {{ news.title }}
      </h3>
      <p v-if="news.summary" class="line-clamp-3 text-sm leading-6 text-body">
        {{ news.summary }}
      </p>
    </div>
  </NuxtLink>
</template>
