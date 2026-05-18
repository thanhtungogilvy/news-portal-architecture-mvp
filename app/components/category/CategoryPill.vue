<script setup lang="ts">
import clsx from 'clsx'
import type { CategoryDto } from '~/types/category'

const props = defineProps<{
  category: CategoryDto
}>()

const route = useRoute()
const isActive = computed(() => route.params.slug === props.category.slug)

const pillClass = computed(() =>
  clsx(
    'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors',
    isActive.value
      ? 'bg-blue text-white'
      : 'bg-white text-body border border-border hover:border-blue hover:text-blue',
  ),
)
</script>

<template>
  <NuxtLink :to="`/categories/${category.slug}`" :class="pillClass">
    {{ category.name }}
  </NuxtLink>
</template>
