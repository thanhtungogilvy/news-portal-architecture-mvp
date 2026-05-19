<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { categories } = useCategoryList()

const searchQuery = ref('')

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/news', query: { q } })
  searchQuery.value = ''
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
    <div class="flex items-center justify-between px-12 py-5">
      <!-- Left: Logo + Nav -->
      <div class="flex items-center gap-12">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
          <div class="size-7 rounded-full bg-navy-900" />
          <span class="font-vietnam font-medium text-base leading-[1.35] text-navy-900">
            Verdana News
          </span>
        </NuxtLink>

        <!-- Nav links -->
        <nav class="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          <NuxtLink
            to="/"
            class="text-base leading-[1.6] transition-colors hover:text-sage-600"
            :class="route.path === '/' ? 'text-sage-600' : 'text-navy-900'"
          >
            Mới nhất
          </NuxtLink>
          <NuxtLink
            v-for="cat in categories"
            :key="cat.slug"
            :to="`/categories/${cat.slug}`"
            class="text-base leading-[1.6] transition-colors hover:text-sage-600"
            :class="route.path === `/categories/${cat.slug}` ? 'text-sage-600' : 'text-navy-900'"
          >
            {{ cat.name }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Search + Subscribe -->
      <div class="flex items-center gap-4">
        <form class="hidden lg:flex" novalidate @submit.prevent="submitSearch">
          <label for="header-search" class="sr-only">Tìm kiếm bài viết</label>
          <div class="flex h-[42px] w-[280px] items-center rounded-lg border border-slate-200 bg-white px-3.5 transition-colors focus-within:border-sage-600 focus-within:ring-1 focus-within:ring-sage-600">
            <IconSearch class="mr-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="header-search"
              v-model="searchQuery"
              type="search"
              placeholder="Tìm kiếm bài viết"
              class="flex-1 bg-transparent text-sm text-navy-900 placeholder:text-slate-400 outline-none"
            >
          </div>
        </form>
        <a
          href="#newsletter-section"
          class="flex min-h-[42px] items-center justify-center rounded-lg bg-navy-900 px-[22px] py-2.5 text-sm font-medium leading-none text-white transition-opacity hover:opacity-90"
        >
          Đăng ký
        </a>
      </div>
    </div>
  </header>
</template>
