<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)
const page = ref(Number(route.query.page ?? 1))

watch(slug, () => { page.value = 1 })

const { news, total, totalPages, status: newsStatus } = useNewsList(
  computed(() => ({ category: slug.value, page: page.value })),
)

const { categories, status: categoryStatus } = useCategoryList()
const currentCategory = computed(() => categories.value.find(c => c.slug === slug.value))
const categoryNotFound = computed(() => categoryStatus.value === 'success' && !currentCategory.value)

function changePage(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: newPage > 1 ? newPage : undefined } })
}

useHead({
  title: () => currentCategory.value?.name ? `${currentCategory.value.name} — Verdana News` : 'Chuyên mục',
})
</script>

<template>
  <div class="bg-white">
    <!-- ─── Category Hero ──────────────────────────────── -->
    <div class="bg-navy-900 px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-12 lg:pb-24 lg:pt-32">
      <p class="text-[13px] font-medium uppercase tracking-[1.6px] text-[#57d8ab]">
        CHUYÊN MỤC
      </p>

      <template v-if="currentCategory">
        <h1 class="mt-4 font-vietnam font-bold text-[48px] leading-[1.05] tracking-[-1.5px] text-white sm:text-[60px] lg:text-[72px] lg:tracking-[-2.16px]">
          {{ currentCategory.name }}
        </h1>
        <p class="mt-5 max-w-[720px] text-[16px] leading-[1.6] text-[#bcc6d5] sm:text-[18px]">
          Khám phá các bài viết, nghiên cứu và phân tích chuyên sâu trong chuyên mục <strong class="text-white/90 font-medium">{{ currentCategory.name }}</strong> — được tổng hợp và biên tập bởi đội ngũ Verdana News.
        </p>
        <div class="mt-8 flex gap-8 pt-2">
          <div v-if="newsStatus !== 'pending'" class="flex flex-col gap-1">
            <span class="font-vietnam font-bold text-[28px] leading-none text-white">{{ total }}</span>
            <span class="text-[12px] font-medium uppercase tracking-[1.4px] text-[#8e9db4]">BÀI VIẾT</span>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div class="h-8 w-12 animate-pulse rounded bg-white/10" />
            <div class="h-3 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </template>

      <template v-else-if="categoryStatus === 'pending'">
        <div class="mt-4 h-16 w-64 animate-pulse rounded bg-white/10 sm:h-20" />
        <div class="mt-5 h-6 w-full max-w-[500px] animate-pulse rounded bg-white/10" />
        <div class="mt-2 h-6 w-72 animate-pulse rounded bg-white/10" />
      </template>
    </div>

    <!-- ─── Filter Chips ───────────────────────────────── -->
    <div class="border-b border-slate-200">
      <div class="overflow-x-auto px-4 py-5 sm:px-6 lg:px-12">
        <div class="flex min-w-max gap-2 sm:flex-wrap sm:min-w-0">
          <NuxtLink
            to="/news"
            class="rounded-full px-[18px] py-[10px] text-[13px] font-medium tracking-[0.4px] border border-slate-200 bg-slate-50 text-navy-900 transition-colors hover:bg-slate-100 whitespace-nowrap"
          >
            Tất cả
          </NuxtLink>
          <template v-if="categoryStatus === 'pending'">
            <div v-for="i in 5" :key="i" class="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
          </template>
          <template v-else>
            <NuxtLink
              v-for="cat in categories"
              :key="cat.id"
              :to="`/categories/${cat.slug}`"
              class="rounded-full px-[18px] py-[10px] text-[13px] font-medium tracking-[0.4px] whitespace-nowrap transition-colors"
              :class="cat.slug === slug
                ? 'bg-navy-900 text-white'
                : 'border border-slate-200 bg-slate-50 text-navy-900 hover:bg-slate-100'"
            >
              {{ cat.name }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>

    <!-- ─── Category Not Found ────────────────────────── -->
    <div
      v-if="categoryNotFound"
      class="px-4 py-24 sm:px-6 lg:px-12"
    >
      <div class="mx-auto max-w-[800px] rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center">
        <p class="font-vietnam font-bold text-[28px] text-navy-900 sm:text-[36px]">
          Không tìm thấy chuyên mục này.
        </p>
        <p class="mt-3 text-[17px] leading-[1.6] text-slate-500">
          Chuyên mục có thể đã bị gỡ bỏ hoặc đường dẫn không còn hợp lệ.
        </p>
        <NuxtLink to="/news" class="mt-8 inline-flex">
          <UiButton variant="secondary">Quay lại bản tin</UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- ─── Articles + Pagination ─────────────────────── -->
    <template v-else>
      <div class="px-4 pb-6 pt-12 sm:px-6 lg:px-12">
        <NewsList :items="news" :pending="newsStatus === 'pending'" :skeleton-count="12" />
      </div>

      <div
        v-if="newsStatus !== 'pending' && news.length === 0"
        class="px-4 py-24 sm:px-6 lg:px-12"
      >
        <div class="mx-auto max-w-[800px] rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center">
          <p class="font-vietnam font-bold text-[28px] text-navy-900">
            Chưa có bài viết trong chuyên mục này.
          </p>
          <p class="mt-3 text-[17px] leading-[1.6] text-slate-500">
            Hãy quay lại danh sách tổng hợp để tiếp tục theo dõi những bài viết mới hơn.
          </p>
          <NuxtLink to="/news" class="mt-8 inline-flex">
            <UiButton variant="secondary">Xem tất cả bài viết</UiButton>
          </NuxtLink>
        </div>
      </div>

      <div v-if="totalPages > 1" class="px-4 py-12 sm:px-6 lg:px-12">
        <UiPagination :current-page="page" :total-pages="totalPages" @change="changePage" />
      </div>
    </template>
  </div>
</template>
