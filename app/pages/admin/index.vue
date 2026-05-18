<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import type { ApiSuccess } from '~/types/api'

dayjs.extend(relativeTime)

definePageMeta({ layout: 'admin', middleware: 'auth' })

type AdminStats = {
  news: { total: number, published: number, draft: number, archived: number }
  categories: { total: number }
}

const { data: statsData, status: statsStatus } = useFetch<ApiSuccess<AdminStats>>('/api/admin/stats', {
  server: false,
  default: (): ApiSuccess<AdminStats> => ({ data: { news: { total: 0, published: 0, draft: 0, archived: 0 }, categories: { total: 0 } } }),
})
const stats = computed(() => statsData.value?.data ?? null)
const statsPending = computed(() => statsStatus.value === 'pending' || statsStatus.value === 'idle')

const { news: recentNews, pending: recentPending } = useAdminNews(undefined, undefined)

function statusColor(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-title">Dashboard</h1>
        <p class="mt-1 text-sm text-body">Welcome to the News Portal admin panel.</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/admin/categories/create">
          <UiButton variant="ghost">New Category</UiButton>
        </NuxtLink>
        <NuxtLink to="/admin/news/create">
          <UiButton>New Article</UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <!-- Total Articles -->
      <NuxtLink to="/admin/news">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Total Articles</p>
          <p class="mt-2 text-3xl font-bold text-title tabular-nums">
            <UiSkeleton v-if="statsPending" class="h-8 w-12" />
            <template v-else>{{ stats?.news.total ?? 0 }}</template>
          </p>
        </UiCard>
      </NuxtLink>

      <!-- Published -->
      <NuxtLink to="/admin/news?status=published">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Published</p>
          <p class="mt-2 text-3xl font-bold text-success tabular-nums">
            <UiSkeleton v-if="statsPending" class="h-8 w-12" />
            <template v-else>{{ stats?.news.published ?? 0 }}</template>
          </p>
        </UiCard>
      </NuxtLink>

      <!-- Drafts -->
      <NuxtLink to="/admin/news?status=draft">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Drafts</p>
          <p class="mt-2 text-3xl font-bold text-warning tabular-nums">
            <UiSkeleton v-if="statsPending" class="h-8 w-12" />
            <template v-else>{{ stats?.news.draft ?? 0 }}</template>
          </p>
        </UiCard>
      </NuxtLink>

      <!-- Categories -->
      <NuxtLink to="/admin/categories">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <p class="text-xs font-medium uppercase tracking-wider text-body">Categories</p>
          <p class="mt-2 text-3xl font-bold text-title tabular-nums">
            <UiSkeleton v-if="statsPending" class="h-8 w-12" />
            <template v-else>{{ stats?.categories.total ?? 0 }}</template>
          </p>
        </UiCard>
      </NuxtLink>
    </div>

    <!-- Recent Articles -->
    <div>
      <h2 class="mb-3 text-sm font-semibold text-title">Recent Articles</h2>
      <div class="overflow-hidden rounded-xl border border-border bg-white">
        <!-- Loading skeletons -->
        <template v-if="recentPending">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0">
            <UiSkeleton class="h-4 flex-1" />
            <UiSkeleton class="h-5 w-16 rounded-full" />
            <UiSkeleton class="h-4 w-20" />
          </div>
        </template>

        <!-- Empty state -->
        <div v-else-if="recentNews.length === 0" class="px-5 py-10 text-center text-sm text-body">
          No articles yet.
        </div>

        <!-- Rows -->
        <template v-else>
          <NuxtLink
            v-for="article in recentNews.slice(0, 5)"
            :key="article.id"
            :to="`/admin/news/${article.id}`"
            class="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0 transition-colors hover:bg-smoke-50"
          >
            <p class="min-w-0 flex-1 truncate text-sm font-medium text-title">{{ article.title }}</p>
            <UiBadge :color="statusColor(article.status)">{{ article.status }}</UiBadge>
            <p class="shrink-0 text-xs text-body">{{ dayjs(article.updatedAt).fromNow() }}</p>
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
