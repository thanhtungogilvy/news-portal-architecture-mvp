<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

// Build page number list with ellipsis
const pages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const result: (number | '...')[] = [1]

  if (current > 3) result.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) result.push(i)

  if (current < total - 2) result.push('...')

  result.push(total)
  return result
})
</script>

<template>
  <nav class="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
    <!-- Prev -->
    <button
      class="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-border bg-white px-3 text-[17px] text-title transition-colors hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="currentPage <= 1"
      aria-label="Previous page"
      @click="emit('change', currentPage - 1)"
    >
      ‹
    </button>

    <!-- Pages -->
    <template v-for="p in pages" :key="p">
      <span
        v-if="p === '...'"
        class="inline-flex h-11 min-w-11 items-center justify-center text-sm text-body"
      >
        …
      </span>
      <button
        v-else
        class="inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-[15px] transition-colors"
        :class="p === currentPage
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-border bg-white text-title hover:border-blue-600 hover:text-blue-600'"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next -->
    <button
      class="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-border bg-white px-3 text-[17px] text-title transition-colors hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="currentPage >= totalPages"
      aria-label="Next page"
      @click="emit('change', currentPage + 1)"
    >
      ›
    </button>
  </nav>
</template>
