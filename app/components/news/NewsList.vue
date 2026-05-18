<script setup lang="ts">
import type { NewsDto } from '~/types/news'

defineProps<{
  items: NewsDto[]
  pending?: boolean
  skeletonCount?: number
}>()
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <template v-if="pending">
      <NewsCardSkeleton v-for="i in (skeletonCount ?? 6)" :key="i" />
    </template>
    <template v-else>
      <NewsCard v-for="article in items" :key="article.id" :news="article" />
    </template>
  </div>
</template>
