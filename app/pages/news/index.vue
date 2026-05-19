<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const category = computed(() => route.query.category as string | undefined)
const q = computed(() => (route.query.q as string) || '')
const page = ref(Number(route.query.page ?? 1))

// Reset page to 1 when category or query changes
watch([category, q], () => { page.value = 1 })

const { news, totalPages, status, total } = useNewsList(
  computed(() => ({ category: category.value, q: q.value || undefined, page: page.value })),
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

    <h1 class="mb-2 text-2xl font-bold text-title">
      <template v-if="q">
        Kết quả tìm kiếm: "{{ q }}"
      </template>
      <template v-else>
        {{ category
          ? categories.find(c => c.slug === category)?.name ?? category
          : 'Tất cả tin tức' }}
      </template>
    </h1>
    <p v-if="q && status !== 'pending'" class="mb-6 text-sm text-body">
      {{ total }} bài viết
    </p>

    <NewsList :items="news" :pending="status === 'pending'" />

    <p v-if="status !== 'pending' && news.length === 0" class="py-10 text-center text-body">
      {{ q ? `Không tìm thấy bài viết nào cho "${q}".` : 'Chưa có bài viết nào.' }}
    </p>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-8">
      <UiPagination :current-page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
