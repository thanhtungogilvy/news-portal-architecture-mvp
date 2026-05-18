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
  <nav class="flex items-center justify-center gap-1" aria-label="Pagination">
    <!-- Prev -->
    <button
      class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-sm text-body transition-colors hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
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
        class="inline-flex h-8 w-8 items-center justify-center text-sm text-body"
      >
        …
      </span>
      <button
        v-else
        class="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors"
        :class="p === currentPage
          ? 'border-blue bg-blue text-white'
          : 'border-border bg-white text-body hover:border-blue hover:text-blue'"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next -->
    <button
      class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-sm text-body transition-colors hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="currentPage >= totalPages"
      aria-label="Next page"
      @click="emit('change', currentPage + 1)"
    >
      ›
    </button>
  </nav>
</template>
