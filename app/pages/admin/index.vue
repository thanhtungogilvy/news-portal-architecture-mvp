<script setup lang="ts">
import clsx from 'clsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import type { ApiSuccess } from '~/types/api'

dayjs.extend(relativeTime)

definePageMeta({ layout: 'admin', middleware: 'admin' })

type AdminStats = {
  news: { total: number, published: number, draft: number, archived: number }
  categories: { total: number }
}

type QueueCounts = {
  pending: number
  processing: number
  completed: number
  failed: number
}

type ImportQueueCounts = {
  pending: number
  processing: number
  published: number
  failed: number
}

type WorkerStatus = {
  embedding: {
    publishedArticles: number
    embeddedArticles: number
    coveragePercent: number
    jobs: QueueCounts
    latestFailure: string | null
  }
  viewCount: {
    jobs: QueueCounts
  }
  import: {
    items: ImportQueueCounts
    activeBatches: number
  }
  refreshedAt: string
}

type CounterRow = {
  label: string
  value: number
  tone: 'default' | 'success' | 'warning' | 'danger'
}

const { data: statsData, status: statsStatus } = useFetch<ApiSuccess<AdminStats>>('/api/admin/stats', {
  server: false,
  default: (): ApiSuccess<AdminStats> => ({ data: { news: { total: 0, published: 0, draft: 0, archived: 0 }, categories: { total: 0 } } }),
})
const stats = computed(() => statsData.value?.data ?? null)
const statsPending = computed(() => statsStatus.value === 'pending' || statsStatus.value === 'idle')

const { data: workerStatusData, status: workerStatusFetchStatus, refresh: refreshWorkerStatus } = useFetch<ApiSuccess<WorkerStatus>>('/api/admin/worker-status', {
  server: false,
  default: (): ApiSuccess<WorkerStatus> => ({
    data: {
      embedding: {
        publishedArticles: 0,
        embeddedArticles: 0,
        coveragePercent: 0,
        jobs: { pending: 0, processing: 0, completed: 0, failed: 0 },
        latestFailure: null,
      },
      viewCount: {
        jobs: { pending: 0, processing: 0, completed: 0, failed: 0 },
      },
      import: {
        items: { pending: 0, processing: 0, published: 0, failed: 0 },
        activeBatches: 0,
      },
      refreshedAt: new Date(0).toISOString(),
    },
  }),
})
const workerStatus = computed(() => workerStatusData.value?.data ?? null)
const workerStatusPending = computed(() => workerStatusFetchStatus.value === 'pending' || workerStatusFetchStatus.value === 'idle')
const hasWorkerStatusSnapshot = computed(() => {
  const refreshedAt = workerStatus.value?.refreshedAt
  return Boolean(refreshedAt && !refreshedAt.startsWith('1970-01-01'))
})
const workerStatusInitialPending = computed(() => workerStatusPending.value && !hasWorkerStatusSnapshot.value)
const workerStatusRefreshing = computed(() => workerStatusFetchStatus.value === 'pending' && hasWorkerStatusSnapshot.value)

const { news: recentNews, pending: recentPending } = useAdminNews(undefined, undefined)

let workerRefreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  workerRefreshTimer = setInterval(() => {
    void refreshWorkerStatus()
  }, 5000)
})

onBeforeUnmount(() => {
  if (workerRefreshTimer) {
    clearInterval(workerRefreshTimer)
  }
})

function statusColor(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  return 'danger'
}

function workerBadgeColor(mode: 'idle' | 'running' | 'blocked'): 'success' | 'warning' | 'danger' {
  if (mode === 'idle') return 'success'
  if (mode === 'running') return 'warning'
  return 'danger'
}

function embeddingWorkerMode(): 'idle' | 'running' | 'blocked' {
  if (!workerStatus.value) return 'running'
  if (workerStatus.value.embedding.jobs.failed > 0) return 'blocked'
  if (workerStatus.value.embedding.jobs.pending > 0 || workerStatus.value.embedding.jobs.processing > 0) return 'running'
  return 'idle'
}

function latestRefreshLabel(value: string | undefined): string {
  if (!value || value.startsWith('1970-01-01')) return 'Refreshing...'
  return dayjs(value).fromNow()
}

function refreshTimeLabel(value: string | undefined): string {
  if (!value || value.startsWith('1970-01-01')) return '--:--:--'
  return dayjs(value).format('HH:mm:ss')
}

function compactError(message: string | null | undefined): string {
  if (!message) return 'No recent failures.'
  return message.length > 160 ? `${message.slice(0, 157)}...` : message
}

function buildQueueRows(counts: QueueCounts): CounterRow[] {
  return [
    { label: 'pending', value: counts.pending, tone: counts.pending > 0 ? 'warning' : 'default' },
    { label: 'processing', value: counts.processing, tone: counts.processing > 0 ? 'warning' : 'default' },
    { label: 'completed', value: counts.completed, tone: counts.completed > 0 ? 'success' : 'default' },
    { label: 'failed', value: counts.failed, tone: counts.failed > 0 ? 'danger' : 'default' },
  ]
}

function buildImportRows(counts: ImportQueueCounts): CounterRow[] {
  return [
    { label: 'pending', value: counts.pending, tone: counts.pending > 0 ? 'warning' : 'default' },
    { label: 'processing', value: counts.processing, tone: counts.processing > 0 ? 'warning' : 'default' },
    { label: 'published', value: counts.published, tone: counts.published > 0 ? 'success' : 'default' },
    { label: 'failed', value: counts.failed, tone: counts.failed > 0 ? 'danger' : 'default' },
  ]
}

function counterValueClass(tone: CounterRow['tone']): string {
  return clsx('font-mono text-lg font-semibold tabular-nums', {
    'text-white': tone === 'default',
    'text-[#87f0c1]': tone === 'success',
    'text-[#ffd58a]': tone === 'warning',
    'text-[#ff9f9f]': tone === 'danger',
  })
}

const embeddingQueueRows = computed(() => buildQueueRows(workerStatus.value?.embedding.jobs ?? { pending: 0, processing: 0, completed: 0, failed: 0 }))
const viewCountQueueRows = computed(() => buildQueueRows(workerStatus.value?.viewCount.jobs ?? { pending: 0, processing: 0, completed: 0, failed: 0 }))
const importQueueRows = computed(() => buildImportRows(workerStatus.value?.import.items ?? { pending: 0, processing: 0, published: 0, failed: 0 }))

const embeddingQueueTotal = computed(() => {
  const jobs = workerStatus.value?.embedding.jobs
  return jobs ? jobs.pending + jobs.processing + jobs.completed + jobs.failed : 0
})

const activityLines = computed(() => {
  if (!workerStatus.value) {
    return ['booting worker monitor...', 'awaiting first metrics payload...']
  }

  const lines = [
    `[embedding] coverage ${workerStatus.value.embedding.embeddedArticles}/${workerStatus.value.embedding.publishedArticles} (${workerStatus.value.embedding.coveragePercent}%)`,
    `[embedding] queue pending=${workerStatus.value.embedding.jobs.pending} processing=${workerStatus.value.embedding.jobs.processing} failed=${workerStatus.value.embedding.jobs.failed}`,
    `[import] items pending=${workerStatus.value.import.items.pending} processing=${workerStatus.value.import.items.processing} active-batches=${workerStatus.value.import.activeBatches}`,
    `[views] queue pending=${workerStatus.value.viewCount.jobs.pending} processing=${workerStatus.value.viewCount.jobs.processing}`,
  ]

  if (workerStatus.value.embedding.latestFailure) {
    lines.push(`[error] ${compactError(workerStatus.value.embedding.latestFailure)}`)
  }
  else {
    lines.push('[system] no recent embedding worker failures')
  }

  return lines
})
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

    <section class="overflow-hidden rounded-[24px] border border-dark-100 bg-dark-900 text-white shadow-product">
      <div class="border-b border-dark-50/70 bg-dark-950/80 px-6 py-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-300">ops / background workers</p>
            <h2 class="mt-2 font-display text-2xl font-semibold tracking-apple-tight text-white">Runtime Monitor</h2>
            <p class="mt-2 max-w-2xl text-sm text-slate-300">
              Live queue health for embedding, import, and view-count workers. Auto-refresh every 5 seconds.
            </p>
          </div>

          <div class="flex items-center gap-3 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="clsx({
              'bg-[#87f0c1] shadow-[0_0_18px_rgba(135,240,193,0.8)]': embeddingWorkerMode() === 'idle',
              'bg-[#ffd58a] shadow-[0_0_18px_rgba(255,213,138,0.8)]': embeddingWorkerMode() === 'running',
              'bg-[#ff9f9f] shadow-[0_0_18px_rgba(255,159,159,0.8)]': embeddingWorkerMode() === 'blocked',
              'animate-pulse': workerStatusRefreshing,
            })" />
            <div>
              <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">embedding status</p>
              <p class="font-mono text-sm text-white">{{ embeddingWorkerMode() }}</p>
            </div>
            <div class="h-8 w-px bg-white/10" />
            <div>
              <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">{{ workerStatusRefreshing ? 'sync state' : 'last refresh' }}</p>
              <p class="font-mono text-sm text-white">{{ workerStatusRefreshing ? 'syncing...' : refreshTimeLabel(workerStatus?.refreshedAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-6">
        <div v-if="workerStatusInitialPending" class="space-y-4">
          <UiSkeleton class="h-4 w-40 bg-white/10" />
          <UiSkeleton class="h-3 w-full rounded-full bg-white/10" />
          <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <UiSkeleton class="h-72 w-full rounded-[22px] bg-white/10" />
            <UiSkeleton class="h-72 w-full rounded-[22px] bg-white/10" />
          </div>
        </div>

        <div v-else class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">embedding coverage</p>
                <div class="mt-2 flex items-end gap-3">
                  <p class="font-mono text-4xl font-semibold text-white tabular-nums">{{ workerStatus?.embedding.coveragePercent ?? 0 }}%</p>
                  <p class="pb-1 font-mono text-sm text-slate-400">
                    {{ workerStatus?.embedding.embeddedArticles ?? 0 }}/{{ workerStatus?.embedding.publishedArticles ?? 0 }} articles
                  </p>
                </div>
              </div>

              <div class="rounded-2xl border border-white/8 bg-dark-950/60 px-4 py-3">
                <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">job snapshots</p>
                <p class="mt-1 font-mono text-lg text-white tabular-nums">{{ embeddingQueueTotal }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-blue-400 via-[#87f0c1] to-[#d4ffed] transition-all duration-500"
                  :style="{ width: `${workerStatus?.embedding.coveragePercent ?? 0}%` }"
                />
              </div>
              <div class="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <span>queue progress</span>
                <span>{{ latestRefreshLabel(workerStatus?.refreshedAt) }}</span>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-3">
              <div class="rounded-[18px] border border-white/8 bg-dark-950/70 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">embedding queue</p>
                  <UiBadge :color="workerBadgeColor(embeddingWorkerMode())">{{ embeddingWorkerMode() }}</UiBadge>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div v-for="row in embeddingQueueRows" :key="row.label">
                    <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{{ row.label }}</p>
                    <p :class="counterValueClass(row.tone)">{{ row.value }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[18px] border border-white/8 bg-dark-950/70 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">import queue</p>
                  <span class="font-mono text-xs text-slate-500">batches {{ workerStatus?.import.activeBatches ?? 0 }}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div v-for="row in importQueueRows" :key="row.label">
                    <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{{ row.label }}</p>
                    <p :class="counterValueClass(row.tone)">{{ row.value }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[18px] border border-white/8 bg-dark-950/70 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">view queue</p>
                  <span class="font-mono text-xs text-slate-500">jobs</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div v-for="row in viewCountQueueRows" :key="row.label">
                    <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{{ row.label }}</p>
                    <p :class="counterValueClass(row.tone)">{{ row.value }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[22px] border border-white/8 bg-dark-950/85 p-5">
            <div class="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
              <div>
                <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">debug trace</p>
                <p class="mt-1 text-sm text-slate-300">Latest worker telemetry snapshot.</p>
              </div>
              <div class="rounded-full border border-white/8 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                live
              </div>
            </div>

            <div class="mt-4 space-y-3 font-mono text-sm">
              <div
                v-for="(line, index) in activityLines"
                :key="`${index}-${line}`"
                class="rounded-2xl border px-3 py-2"
                :class="clsx(
                  'border-white/6 bg-white/[0.03] text-slate-200',
                  line.startsWith('[error]') && 'border-error-dark/40 bg-error-dark/10 text-[#ffb6b6]',
                  line.startsWith('[system]') && 'text-[#87f0c1]',
                )"
              >
                {{ line }}
              </div>
            </div>

            <div class="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">latest embedding failure</p>
              <p class="mt-2 font-mono text-sm leading-6 text-slate-300">
                {{ compactError(workerStatus?.embedding.latestFailure) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

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
