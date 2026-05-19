<script setup lang="ts">
import clsx from 'clsx'
import type { CategoryDto } from '~/types/category'

const props = defineProps<{
  category: CategoryDto
}>()

const route = useRoute()
const isActive = computed(() => {
  if (route.path === '/news') return route.query.category === props.category.slug
  if (route.path.startsWith('/categories/')) return route.params.slug === props.category.slug
  return false
})

const pillClass = computed(() =>
  clsx(
    'inline-flex min-h-[44px] items-center rounded-full border px-4 text-[14px] leading-[1.29] tracking-[-0.224px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    isActive.value
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-border bg-white text-title hover:border-blue-600 hover:text-blue-600',
  ),
)
</script>

<template>
  <NuxtLink :to="{ path: '/news', query: { category: category.slug } }" :class="pillClass">
    {{ category.name }}
  </NuxtLink>
</template>
