<script setup lang="ts">
const { categories, status } = useCategoryList()
</script>

<template>
  <nav class="flex flex-wrap gap-2">
    <template v-if="status === 'pending'">
      <UiSkeleton v-for="i in 5" :key="i" class="h-8 w-20 rounded-full" />
    </template>
    <CategoryPill
      v-for="category in categories"
      v-else
      :key="category.id"
      :category="category"
    />
  </nav>
</template>
