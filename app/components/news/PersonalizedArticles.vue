<script setup lang="ts">
import type { NewsDto } from '~/types/news'

withDefaults(defineProps<{
  data: NewsDto[]
  pending?: boolean
  title?: string
}>(), {
  title: 'Có thể bạn quan tâm',
})
</script>

<template>
  <section v-if="data.length > 0" class="border-t border-slate-200 bg-white px-4 pb-16 pt-12 sm:px-6 lg:px-12">
    <div class="mx-auto max-w-7xl">
      <div class="mb-8">
        <p class="text-[13px] font-medium uppercase tracking-[1.6px] text-slate-400">
          GỢI Ý DÀNH CHO BẠN
        </p>
        <h2 class="mt-2 font-vietnam font-bold text-[24px] leading-[1.2] tracking-[-0.36px] text-navy-900 sm:text-[28px]">
          {{ title }}
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NewsCard
          v-for="article in data"
          :key="article.id"
          :news="article"
          variant="standard"
        />
      </div>
    </div>
  </section>
</template>
