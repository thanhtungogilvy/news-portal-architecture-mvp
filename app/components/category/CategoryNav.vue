<script setup lang="ts">
import clsx from 'clsx'

const { categories, status } = useCategoryList()

const route = useRoute()
const allActive = computed(() => route.path === '/news' && !route.query.category)
const allPillClass = computed(() =>
  clsx(
    'inline-flex min-h-[44px] items-center rounded-full border px-4 text-[14px] leading-[1.29] tracking-[-0.224px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    allActive.value
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-border bg-white text-title hover:border-blue-600 hover:text-blue-600',
  ),
)
</script>

<template>
  <nav class="flex flex-col gap-4" aria-label="Category navigation">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-title">
          Chuyên mục
        </p>
        <p class="mt-1 text-[14px] leading-[1.43] tracking-[-0.224px] text-[#7A7A7A]">
          Chọn dòng tin bạn muốn theo dõi.
        </p>
      </div>
    </div>

    <div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div class="flex min-w-max gap-2.5 pb-1 sm:min-w-0 sm:flex-wrap">
      <template v-if="status === 'pending'">
        <UiSkeleton v-for="i in 5" :key="i" class="h-11 w-24 rounded-full" />
      </template>
      <template v-else>
        <NuxtLink to="/news" :class="allPillClass">
          Tất cả
        </NuxtLink>
        <CategoryPill
          v-for="category in categories"
          :key="category.id"
          :category="category"
        />
      </template>
      </div>
    </div>
  </nav>
</template>
