<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)
const page = ref(Number(route.query.page ?? 1))

watch(slug, () => { page.value = 1 })

const { news, totalPages, status: newsStatus } = useNewsList(
  computed(() => ({ category: slug.value, page: page.value })),
)

const { categories, status: categoryStatus } = useCategoryList()
const currentCategory = computed(() => categories.value.find(category => category.slug === slug.value))
const categoryNotFound = computed(() => categoryStatus.value === 'success' && !currentCategory.value)

function changePage(newPage: number) {
  page.value = newPage
  router.push({
    query: {
      ...route.query,
      page: newPage > 1 ? newPage : undefined,
    },
  })
}
</script>

<template>
  <div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div class="max-w-3xl border-b border-border pb-8">
        <p class="text-[18px] font-semibold leading-[1.25] tracking-[0.1px] text-title sm:text-[21px] sm:leading-[1.19] sm:tracking-[0.231px]">
          Chuyên mục
        </p>
        <template v-if="currentCategory">
          <h1 class="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.2px] text-title sm:text-[42px] md:text-[48px] lg:text-[56px] lg:tracking-apple-tight">
            {{ currentCategory.name }}
          </h1>
          <p class="mt-4 text-[18px] leading-[1.55] text-title/88 sm:text-[20px] sm:font-light md:text-[21px] md:leading-[1.5]">
            Dòng bài viết trong chuyên mục này được trình bày theo nhịp đọc liền mạch, ưu tiên quét nhanh và đọc sâu.
          </p>
        </template>
        <template v-else-if="categoryStatus === 'pending'">
          <UiSkeleton class="mt-4 h-14 w-64" />
          <UiSkeleton class="mt-4 h-7 w-full max-w-2xl" />
        </template>
      </div>

      <div class="mt-8">
        <CategoryNav />
      </div>

      <div
        v-if="categoryNotFound"
        class="mt-10 rounded-[18px] border border-dashed border-border bg-smoke-200 px-6 py-16 text-center"
      >
        <p class="text-[34px] font-semibold leading-[1.1] text-title">
          Không tìm thấy chuyên mục này.
        </p>
        <p class="mt-3 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
          Chuyên mục có thể đã bị gỡ bỏ hoặc đường dẫn không còn hợp lệ.
        </p>
        <NuxtLink to="/news" class="mt-6 inline-flex">
          <UiButton variant="secondary">Quay lại bản tin</UiButton>
        </NuxtLink>
      </div>

      <template v-else>
        <div class="mt-10">
          <NewsList :items="news" :pending="newsStatus === 'pending'" :skeleton-count="9" />
        </div>

        <div
          v-if="newsStatus !== 'pending' && news.length === 0"
          class="mt-10 rounded-[18px] border border-dashed border-border bg-smoke-200 px-6 py-16 text-center"
        >
          <p class="text-[34px] font-semibold leading-[1.1] text-title">
            Chưa có bài viết trong chuyên mục này.
          </p>
          <p class="mt-3 text-[17px] leading-[1.47] tracking-apple text-[#333333]">
            Hãy thử quay lại danh sách tổng hợp để tiếp tục theo dõi những bài viết mới hơn.
          </p>
        </div>

        <div v-if="totalPages > 1" class="mt-12">
          <UiPagination :current-page="page" :total-pages="totalPages" @change="changePage" />
        </div>
      </template>
    </div>
  </div>
</template>
