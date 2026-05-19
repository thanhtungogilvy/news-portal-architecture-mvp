<script setup lang="ts">
const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Tin mới', to: '/news' },
]
</script>

<template>
  <header class="sticky top-0 z-40">
    <div class="bg-black text-white">
      <div class="mx-auto flex min-h-11 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <NuxtLink to="/" class="shrink-0 text-xs tracking-[-0.12px] text-white/88">
          News Portal
        </NuxtLink>

        <nav class="hidden items-center gap-4 lg:flex" aria-label="Global">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="text-xs tracking-[-0.12px] text-white/82 transition-colors hover:text-white"
            active-class="text-white"
            exact-active-class="text-white"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="`${item.to}-mobile`"
            :to="item.to"
            class="text-xs tracking-[-0.12px] text-white/82 transition-colors hover:text-white lg:hidden"
            active-class="text-white"
            exact-active-class="text-white"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink to="/news" class="hidden sm:inline-flex">
            <UiButton size="sm">Đọc ngay</UiButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="border-b border-border bg-white/88 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:min-h-[52px] md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <p class="text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-title">
            Bản tin
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <NuxtLink to="/news" class="text-[14px] leading-[1.29] tracking-[-0.224px] text-title transition-colors hover:text-blue-600">
            Tất cả bài viết
          </NuxtLink>
          <NuxtLink to="/news" class="inline-flex sm:hidden">
            <UiButton size="sm">Đọc ngay</UiButton>
          </NuxtLink>
          <NuxtLink to="/news" class="hidden sm:inline-flex">
            <UiButton size="sm">Theo dõi</UiButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>
