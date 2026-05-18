<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const category = computed(() => route.query.category as string | undefined)
const page = ref(Number(route.query.page ?? 1))

// Reset page to 1 when category changes
watch(category, () => { page.value = 1 })

const { news, totalPages, status } = useNewsList(
  computed(() => ({ category: category.value, page: page.value })),
)

const { categories } = useCategoryList()

function changePage(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: newPage > 1 ? newPage : undefined } })
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div class="mb-8">
      <CategoryNav />
    </div>

    <h1 class="mb-6 text-2xl font-bold text-title">
      {{ category
        ? categories.find(c => c.slug === category)?.name ?? category
        : 'Tất cả tin tức' }}
    </h1>

    <NewsList :items="news" :pending="status === 'pending'" />

    <p v-if="status !== 'pending' && news.length === 0" class="py-10 text-center text-body">
      Chưa có bài viết nào.
    </p>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-8">
      <UiPagination :current-page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
