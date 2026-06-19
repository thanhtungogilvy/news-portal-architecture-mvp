<script setup lang="ts">
import type { ChatMessage } from '~/composables/chat/useRagChat'

defineProps<{
  message: ChatMessage
}>()
</script>

<template>
  <div
    class="flex w-full"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-[1.6]"
      :class="message.role === 'user'
        ? 'bg-navy-900 text-white rounded-br-sm'
        : 'bg-slate-100 text-navy-900 rounded-bl-sm'"
    >
      <p class="whitespace-pre-wrap">{{ message.content }}</p>
    </div>
  </div>
</template>
