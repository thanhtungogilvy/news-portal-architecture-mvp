<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const page = ref(1)

const { news, totalPages, status: newsStatus } = useNewsList(
  computed(() => ({ category: slug.value, page: page.value })),
)

// Resolve category name for heading
const { categories, status: categoryStatus } = useCategoryList()
const currentCategory = computed(() => categories.value.find(c => c.slug === slug.value))
const categoryNotFound = computed(
  () => categoryStatus.value === 'success' && !currentCategory.value,
)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div class="mb-8">
      <CategoryNav />
    </div>

    <!-- Category not found -->
    <div v-if="categoryNotFound" class="py-20 text-center">
      <p class="text-xl font-semibold text-title">
        Category not found
      </p>
      <NuxtLink to="/" class="mt-4 inline-block text-sm text-blue hover:underline">
        Return to home
      </NuxtLink>
    </div>

    <!-- Category content -->
    <template v-else>
      <h1 class="mb-6 text-2xl font-bold text-title">
        <template v-if="currentCategory">
          {{ currentCategory.name }}
        </template>
        <UiSkeleton v-else class="h-8 w-40" />
      </h1>

      <NewsList :items="news" :pending="newsStatus === 'pending'" />

      <p v-if="newsStatus !== 'pending' && news.length === 0" class="py-10 text-center text-body">
        No published news in this category yet.
      </p>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8">
        <UiPagination :current-page="page" :total-pages="totalPages" @change="page = $event" />
      </div>
    </template>
  </div>
</template>
