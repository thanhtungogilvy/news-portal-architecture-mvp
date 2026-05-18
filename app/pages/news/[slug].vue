<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { article, status, recordView } = useNewsDetail(slug)

onMounted(() => {
  const stop = watch(
    article,
    (val) => {
      if (val?.id) {
        recordView(val.id)
        stop()
      }
    },
    { immediate: true },
  )
})

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <!-- Loading -->
    <template v-if="status === 'pending'">
      <UiSkeleton class="mb-4 h-10 w-3/4" />
      <UiSkeleton class="mb-2 h-4 w-32" />
      <UiSkeleton class="mb-8 aspect-video w-full rounded-xl" />
      <div class="space-y-3">
        <UiSkeleton class="h-4 w-full" />
        <UiSkeleton class="h-4 w-full" />
        <UiSkeleton class="h-4 w-5/6" />
      </div>
    </template>

    <!-- Not found -->
    <div v-else-if="!article" class="py-20 text-center">
      <p class="text-xl font-semibold text-title">
        Article not found
      </p>
      <NuxtLink to="/" class="mt-4 inline-block text-sm text-blue hover:underline">
        Return to home
      </NuxtLink>
    </div>

    <!-- Article -->
    <article v-else>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <UiBadge v-if="article.category" color="primary">
          {{ article.category.name }}
        </UiBadge>
        <span class="text-sm text-body">{{ formatDate(article.publishedAt) }}</span>
      </div>

      <h1 class="mb-6 text-3xl font-bold leading-tight text-title">
        {{ article.title }}
      </h1>

      <div v-if="article.thumbnailUrl" class="mb-8 overflow-hidden rounded-xl">
        <img
          :src="article.thumbnailUrl"
          :alt="article.title"
          class="w-full object-cover"
          loading="eager"
        >
      </div>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        class="prose prose-gray max-w-none text-body leading-relaxed"
        v-html="article.content"
      />
    </article>
  </div>
</template>
