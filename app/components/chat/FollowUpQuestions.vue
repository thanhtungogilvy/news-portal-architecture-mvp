<script setup lang="ts">
defineProps<{
  questions: [string, string, string]
}>()

const emit = defineEmits<{
  select: [question: string]
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="question in questions"
      :key="question"
      type="button"
      class="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] leading-[1.4] text-navy-900 transition-colors hover:border-sage-600 hover:text-sage-600"
      @click="emit('select', question)"
    >
      {{ question }}
    </button>
  </div>
</template>
