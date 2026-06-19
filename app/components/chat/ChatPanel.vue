<script setup lang="ts">
import { useRagChat } from '~/composables/chat/useRagChat'

const { messages, pending, error, send, clear } = useRagChat()

const input = ref('')
const listRef = ref<HTMLElement | null>(null)

async function handleSend() {
  const msg = input.value.trim()
  if (!msg || pending.value) return
  input.value = ''
  await send(msg)
  await nextTick()
  scrollToBottom()
}

function handleFollowUp(question: string) {
  input.value = question
  handleSend()
}

function scrollToBottom() {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

watch(() => messages.value.length, async () => {
  await nextTick()
  scrollToBottom()
})
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Message list -->
    <div
      ref="listRef"
      class="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div class="flex size-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </div>
        <div>
          <p class="font-vietnam font-semibold text-[20px] text-navy-900">Hỏi về tin tức</p>
          <p class="mt-1.5 text-[14px] text-slate-400">Đặt câu hỏi về bất kỳ chủ đề nào trong kho bài viết</p>
        </div>
        <div class="mt-2 flex flex-wrap justify-center gap-2">
          <button
            v-for="q in ['AI có ứng dụng gì?', 'Tin tức khoa học mới nhất?', 'Xu hướng công nghệ 2025?']"
            :key="q"
            type="button"
            class="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] text-navy-900 transition-colors hover:border-sage-600 hover:text-sage-600"
            @click="handleFollowUp(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div v-else class="space-y-4">
        <template v-for="(msg, idx) in messages" :key="idx">
          <ChatMessage :message="msg" />

          <!-- Assistant extras: article cards + follow-ups -->
          <template v-if="msg.role === 'assistant'">
            <div v-if="msg.articles && msg.articles.length > 0" class="ml-2 space-y-2">
              <p class="text-[12px] font-medium uppercase tracking-[1.2px] text-slate-400">
                Bài viết liên quan
              </p>
              <div class="grid gap-2 sm:grid-cols-2">
                <ChatArticleCard
                  v-for="article in msg.articles"
                  :key="article.slug"
                  :article="article"
                />
              </div>
            </div>

            <div
              v-if="msg.followUpQuestions && idx === messages.length - 1 && !pending"
              class="ml-2"
            >
              <FollowUpQuestions
                :questions="msg.followUpQuestions"
                @select="handleFollowUp"
              />
            </div>
          </template>
        </template>

        <!-- Typing indicator -->
        <div v-if="pending" class="flex justify-start">
          <div class="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
            <div class="flex items-center gap-1">
              <span class="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
              <span class="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span class="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 sm:mx-6">
      {{ error }}
    </div>

    <!-- Input bar -->
    <div class="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <form class="flex items-end gap-3" novalidate @submit.prevent="handleSend">
        <div class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-colors focus-within:border-sage-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-sage-600">
          <textarea
            v-model="input"
            rows="1"
            placeholder="Đặt câu hỏi về bài viết..."
            class="w-full resize-none bg-transparent text-[15px] leading-[1.6] text-navy-900 placeholder:text-slate-400 outline-none"
            :disabled="pending"
            @keydown.enter.exact.prevent="handleSend"
          />
        </div>
        <button
          type="submit"
          :disabled="!input.trim() || pending"
          class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Gửi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </button>

        <button
          v-if="messages.length > 0"
          type="button"
          class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-navy-900"
          aria-label="Xoá lịch sử"
          @click="clear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </form>
      <p class="mt-2 text-[11px] text-slate-400">
        Câu trả lời được tổng hợp từ các bài viết trong kho tin tức · Enter để gửi
      </p>
    </div>
  </div>
</template>
