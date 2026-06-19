<script setup lang="ts">
useSeoMeta({
  title: 'Hỏi đáp tin tức · Verdana News',
  description: 'Đặt câu hỏi về tin tức và nhận câu trả lời được tổng hợp từ các bài viết trong kho tin.',
  ogTitle: 'Hỏi đáp tin tức · Verdana News',
  ogDescription: 'AI tổng hợp thông tin từ bài báo để trả lời câu hỏi của bạn.',
})
</script>

<template>
  <div class="flex h-[calc(100dvh-64px)] flex-col">
    <ChatPanel />
  </div>
</template>
