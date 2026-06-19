<script setup lang="ts">
import type { NewsDto } from '~/types/news'

defineProps<{
  data: NewsDto[]
  pending?: boolean
}>()
</script>

<template>
  <section v-if="data.length > 0" class="bg-slate-50 px-4 pb-16 pt-12 sm:px-6 lg:px-12">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-8">
        <p class="text-[13px] font-medium uppercase tracking-[1.6px] text-slate-400">
          TRONG CÙNG CHUYÊN MỤC
        </p>
        <h2 class="mt-2 font-vietnam font-bold text-[24px] leading-[1.2] tracking-[-0.36px] text-navy-900 sm:text-[28px]">
          Bài viết tương tự
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
