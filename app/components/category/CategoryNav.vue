<script setup lang="ts">
import clsx from 'clsx'

const { categories, status } = useCategoryList()

const route = useRoute()
const allActive = computed(() => route.path === '/news' && !route.query.category)
const allPillClass = computed(() =>
  clsx(
    'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors',
    allActive.value
      ? 'bg-blue text-white'
      : 'bg-white text-body border border-border hover:border-blue hover:text-blue',
  ),
)
</script>

<template>
  <nav class="flex flex-wrap gap-2">
    <template v-if="status === 'pending'">
      <UiSkeleton v-for="i in 5" :key="i" class="h-8 w-20 rounded-full" />
    </template>
    <template v-else>
      <NuxtLink to="/news" :class="allPillClass">
        Tất cả
      </NuxtLink>
      <CategoryPill
        v-for="category in categories"
        :key="category.id"
        :category="category"
      />
    </template>
  </nav>
</template>
