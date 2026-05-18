<script setup lang="ts">
import type { NewsDto } from '~/types/news'

defineProps<{
  news: NewsDto
}>()

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <NuxtLink :to="`/news/${news.slug}`" class="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md">
    <div class="aspect-video w-full overflow-hidden bg-smoke-200">
      <img
        v-if="news.thumbnailUrl"
        :src="news.thumbnailUrl"
        :alt="news.title"
        class="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="h-full w-full bg-smoke-300" />
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-center gap-2">
        <UiBadge v-if="news.category" color="primary">
          {{ news.category.name }}
        </UiBadge>
        <span class="text-xs text-body">{{ formatDate(news.publishedAt) }}</span>
      </div>
      <h3 class="line-clamp-2 text-sm font-semibold text-title group-hover:text-blue transition-colors">
        {{ news.title }}
      </h3>
      <p v-if="news.summary" class="line-clamp-2 text-xs text-body">
        {{ news.summary }}
      </p>
    </div>
  </NuxtLink>
</template>
