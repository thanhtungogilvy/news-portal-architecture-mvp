<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const category = computed(() => route.query.category as string | undefined)
const q = computed(() => (route.query.q as string) || '')
const page = ref(Number(route.query.page ?? 1))

watch([category, q], () => { page.value = 1 })

const { news, totalPages, status, total } = useNewsList(
  computed(() => ({ category: category.value, q: q.value || undefined, page: page.value })),
)

const { categories, status: categoryStatus } = useCategoryList()

const pageTitle = computed(() => {
  if (q.value) return `Kết quả tìm kiếm: "${q.value}"`
  if (category.value) return categories.value.find(c => c.slug === category.value)?.name ?? category.value
  return 'Tin tức mới nhất'
})

function changePage(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: newPage > 1 ? newPage : undefined } })
}
</script>

<template>
  <div class="bg-white">
    <!-- ─── Page Header ────────────────────────────── -->
    <div class="border-b border-slate-200 px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-16 lg:px-12 lg:pb-16 lg:pt-24">
      <p class="text-[13px] font-medium tracking-[1.6px] text-slate-400 uppercase">
        {{ q ? 'TÌM KIẾM' : 'MỌI BÀI VIẾT' }}
      </p>
      <h1 class="mt-3 font-vietnam font-bold text-3xl leading-[1.1] tracking-[-0.5px] text-navy-900 sm:text-4xl lg:text-[56px] lg:tracking-[-1.12px]">
        {{ pageTitle }}
      </h1>
      <p v-if="!q" class="mt-4 max-w-2xl text-base leading-[1.6] text-slate-500 sm:text-[18px]">
        Khám phá các câu chuyện mới nhất về sức khỏe, thể chất và khoa học chăm sóc bản thân, được biên tập bởi đội ngũ Verdana News.
      </p>
      <p v-else-if="status !== 'pending'" class="mt-3 text-sm text-slate-500">
        {{ total }} kết quả
      </p>
    </div>

    <!-- ─── Filter Chips ───────────────────────────── -->
    <div class="border-b border-slate-200">
      <div class="overflow-x-auto px-4 sm:px-6 lg:px-12">
        <div class="flex min-w-max gap-2 py-4 sm:min-w-0 sm:flex-wrap">
          <template v-if="categoryStatus === 'pending'">
            <div v-for="i in 6" :key="i" class="h-9 w-20 animate-pulse rounded-full bg-slate-200" />
          </template>
          <template v-else>
            <NuxtLink
              to="/news"
              :class="[
                'inline-flex items-center rounded-full px-[18px] py-[10px] text-[13px] font-medium tracking-[0.4px] transition-colors whitespace-nowrap',
                !category && !q
                  ? 'bg-navy-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-navy-900 hover:bg-slate-100',
              ]"
            >
              Tất cả
            </NuxtLink>
            <NuxtLink
              v-for="cat in categories"
              :key="cat.slug"
              :to="`/news?category=${cat.slug}`"
              :class="[
                'inline-flex items-center rounded-full px-[18px] py-[10px] text-[13px] font-medium tracking-[0.4px] transition-colors whitespace-nowrap',
                category === cat.slug
                  ? 'bg-navy-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-navy-900 hover:bg-slate-100',
              ]"
            >
              {{ cat.name }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>

    <!-- ─── Articles Grid ──────────────────────────── -->
    <div class="px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-12">
      <NewsList :items="news" :pending="status === 'pending'" :skeleton-count="9" />

      <p v-if="status !== 'pending' && news.length === 0" class="py-16 text-center text-slate-500">
        {{ q ? `Không tìm thấy bài viết nào cho "${q}".` : 'Chưa có bài viết nào.' }}
      </p>

      <div v-if="totalPages > 1" class="mt-10">
        <UiPagination :current-page="page" :total-pages="totalPages" @change="changePage" />
      </div>
    </div>
  </div>
</template>
