<script setup lang="ts">
import type { NewsDto } from '~/types/news'

withDefaults(defineProps<{
  items: NewsDto[]
  pending?: boolean
  skeletonCount?: number
  variant?: 'standard' | 'lead' | 'compact'
  columns?: 'grid' | 'compact'
}>(), {
  variant: 'standard',
  columns: 'grid',
})
</script>

<template>
  <div
    class="gap-5 md:gap-6"
    :class="columns === 'compact'
      ? 'grid lg:grid-cols-2'
      : 'grid md:grid-cols-2 2xl:grid-cols-3'"
  >
    <template v-if="pending">
      <NewsCardSkeleton v-for="i in (skeletonCount ?? 6)" :key="i" :variant="variant" />
    </template>
    <template v-else>
      <NewsCard v-for="article in items" :key="article.id" :news="article" :variant="variant" />
    </template>
  </div>
</template>
