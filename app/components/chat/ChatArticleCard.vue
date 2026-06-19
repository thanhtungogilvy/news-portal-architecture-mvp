<script setup lang="ts">
import type { ChatArticleCard } from '~/composables/chat/useRagChat'

defineProps<{
  article: ChatArticleCard
}>()
</script>

<template>
  <NuxtLink
    :to="`/news/${article.slug}`"
    class="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-shadow hover:shadow-sm"
  >
    <div class="size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
      <img
        v-if="article.thumbnailUrl"
        :src="article.thumbnailUrl"
        :alt="article.title"
        class="h-full w-full object-cover"
        loading="lazy"
      >
      <div v-else class="h-full w-full bg-slate-100" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-navy-900 transition-colors group-hover:text-sage-600">
        {{ article.title }}
      </p>
      <p v-if="article.summary" class="mt-1 line-clamp-2 text-[12px] leading-[1.4] text-slate-400">
        {{ article.summary }}
      </p>
    </div>
  </NuxtLink>
</template>
