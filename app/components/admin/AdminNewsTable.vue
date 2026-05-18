<script setup lang="ts">
import dayjs from 'dayjs'
import type { NewsDto } from '~/types/news'

defineProps<{
  news: NewsDto[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

function statusColor(status: NewsDto['status']): 'success' | 'warning' | 'danger' {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  return 'danger'
}

function statusLabel(status: NewsDto['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(iso: string | null) {
  return iso ? dayjs(iso).format('MMM D, YYYY HH:mm') : '—'
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-border bg-white">
    <table class="min-w-full divide-y divide-border text-sm">
      <thead>
        <tr class="bg-smoke-50">
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Title</th>
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Status</th>
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Category</th>
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Published</th>
          <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-body">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <!-- Loading skeletons -->
        <template v-if="loading">
          <tr v-for="n in 8" :key="n">
            <td class="px-5 py-3"><UiSkeleton class="h-4 w-48" /></td>
            <td class="px-5 py-3"><UiSkeleton class="h-5 w-20 rounded-full" /></td>
            <td class="px-5 py-3"><UiSkeleton class="h-4 w-24" /></td>
            <td class="px-5 py-3"><UiSkeleton class="h-4 w-24" /></td>
            <td class="px-5 py-3 text-right"><UiSkeleton class="ml-auto h-7 w-20" /></td>
          </tr>
        </template>

        <!-- Empty state -->
        <tr v-else-if="news.length === 0">
          <td colspan="5" class="px-5 py-10 text-center text-sm text-body">
            No articles yet. Create one to get started.
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-for="article in news"
          v-else
          :key="article.id"
          class="transition-colors hover:bg-smoke-50"
        >
          <td class="max-w-xs px-5 py-3">
            <p class="truncate font-medium text-title">{{ article.title }}</p>
            <p class="truncate text-xs text-body">{{ article.slug }}</p>
          </td>
          <td class="px-5 py-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <UiBadge :color="statusColor(article.status)">{{ statusLabel(article.status) }}</UiBadge>
            </div>
          </td>
          <td class="px-5 py-3 text-body">{{ article.category?.name ?? '—' }}</td>
          <td class="px-5 py-3 text-body">{{ formatDate(article.publishedAt) }}</td>
          <td class="px-5 py-3 text-right">
            <div class="inline-flex items-center gap-1">
              <!-- View in new tab (only for published articles) -->
              <a
                v-if="article.status === 'published'"
                :href="`/news/${article.slug}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-smoke-100 hover:text-title"
                title="View article"
                aria-label="View article"
              >
                <IconArrowTopRightOnSquare class="h-4 w-4" />
              </a>

              <!-- Edit -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-smoke-100 hover:text-title"
                title="Edit article"
                aria-label="Edit article"
                @click="emit('edit', article.id)"
              >
                <IconPencil class="h-4 w-4" />
              </button>

              <!-- Delete -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-error-light hover:text-error"
                title="Delete article"
                aria-label="Delete article"
                @click="emit('delete', article.id)"
              >
                <IconTrash class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
