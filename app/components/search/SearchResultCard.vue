<script setup lang="ts">
import type { SearchResult } from '~/types/search'

const props = defineProps<{
  result: SearchResult
}>()

const score = computed(() => {
  const percent = Math.round(props.result.score * 100)
  return `${percent}% relevans`
})
</script>

<template>
  <NuxtLink
    :to="`/news/${result.slug}`"
    class="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
  >
    <article class="flex flex-col gap-4 sm:flex-row">
      <!-- Image -->
      <div class="aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-square sm:w-32 sm:shrink-0">
        <img
          v-if="result.thumbnailUrl"
          :src="result.thumbnailUrl"
          :alt="result.title"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        >
        <div v-else class="h-full w-full bg-slate-200" />
      </div>

      <!-- Content -->
      <div class="flex flex-col justify-between gap-3 p-4 sm:gap-2 sm:px-4 sm:py-3">
        <!-- Metadata -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-slate-600">
          <span v-if="result.category" class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700">
            {{ result.category }}
          </span>
          <span class="text-slate-500">{{ score }}</span>
        </div>

        <!-- Title & Summary -->
        <div class="space-y-2">
          <h3 class="line-clamp-2 text-base font-semibold leading-snug text-slate-900 sm:text-[15px]">
            {{ result.title }}
          </h3>
          <p v-if="result.summary" class="line-clamp-2 text-sm leading-relaxed text-slate-600">
            {{ result.summary }}
          </p>
        </div>

        <!-- Read More Link -->
        <div class="text-sm font-medium text-blue-600 group-hover:text-blue-700">
          Đọc bài viết →
        </div>
      </div>
    </article>
  </NuxtLink>
</template>
