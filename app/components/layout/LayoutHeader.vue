<script setup lang="ts">
const route = useRoute()
const { categories } = useCategoryList()
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
        <div class="hidden h-[42px] w-[280px] items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 lg:flex">
          <span class="flex-1 text-sm leading-none text-slate-500">Tìm kiếm bài viết</span>
        </div>
        <button
          class="flex min-h-[42px] items-center justify-center rounded-lg bg-navy-900 px-[22px] py-2.5 text-sm font-medium leading-none text-white transition-opacity hover:opacity-90"
        >
          Đăng ký
        </button>
      </div>
    </div>
  </header>
</template>
