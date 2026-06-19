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

type WorkerActivityEntry = {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  text: string
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

function embeddingWorkerMode(): 'idle' | 'running' | 'blocked' {
  if (!workerStatus.value) return 'running'
  if (workerStatus.value.embedding.jobs.failed > 0) return 'blocked'
  if (workerStatus.value.embedding.jobs.pending > 0 || workerStatus.value.embedding.jobs.processing > 0) return 'running'
  return 'idle'
}

function refreshTimeLabel(value: string | undefined): string {
  if (!value || value.startsWith('1970-01-01')) return '--:--:--'
  return dayjs(value).format('HH:mm:ss')
}

function compactError(message: string | null | undefined): string {
  if (!message) return ''
  return message.length > 200 ? `${message.slice(0, 197)}...` : message
}

const workerActivityLog = ref<WorkerActivityEntry[]>([])
let previousWorkerSnapshot: WorkerStatus | null = null
let activitySequence = 0

function pushWorkerActivity(level: WorkerActivityEntry['level'], text: string): void {
  activitySequence += 1
  const stamp = dayjs().format('HH:mm:ss')
  workerActivityLog.value = [
    {
      id: `${stamp}-${activitySequence}`,
      timestamp: stamp,
      level,
      text,
    },
    ...workerActivityLog.value,
  ].slice(0, 50)
}

watch(workerStatus, (current) => {
  if (!current || !hasWorkerStatusSnapshot.value) {
    return
  }

  if (!previousWorkerSnapshot) {
    pushWorkerActivity('info', `[boot] snapshot loaded coverage=${current.embedding.embeddedArticles}/${current.embedding.publishedArticles} pending=${current.embedding.jobs.pending} processing=${current.embedding.jobs.processing}`)

    if (current.embedding.latestFailure) {
      pushWorkerActivity('error', `[embedding] restored latest failure ${compactError(current.embedding.latestFailure)}`)
    }
    else {
      pushWorkerActivity('success', '[system] no recent embedding worker failures')
    }

    previousWorkerSnapshot = {
      ...current,
      embedding: { ...current.embedding, jobs: { ...current.embedding.jobs } },
      import: { ...current.import, items: { ...current.import.items } },
      viewCount: { ...current.viewCount, jobs: { ...current.viewCount.jobs } },
    }
    return
  }

  const previous = previousWorkerSnapshot

  if (current.embedding.embeddedArticles > previous.embedding.embeddedArticles) {
    const delta = current.embedding.embeddedArticles - previous.embedding.embeddedArticles
    pushWorkerActivity('success', `[embedding] completed +${delta} -> ${current.embedding.embeddedArticles}/${current.embedding.publishedArticles} (${current.embedding.coveragePercent}%)`)
  }

  if (current.embedding.jobs.processing > previous.embedding.jobs.processing) {
    pushWorkerActivity('warning', `[embedding] workers claimed ${current.embedding.jobs.processing} job(s) in processing`)
  }

  if (current.embedding.jobs.pending > previous.embedding.jobs.pending) {
    const delta = current.embedding.jobs.pending - previous.embedding.jobs.pending
    pushWorkerActivity('info', `[embedding] queued +${delta} pending job(s)`)
  }

  if (current.import.items.processing !== previous.import.items.processing || current.import.activeBatches !== previous.import.activeBatches) {
    pushWorkerActivity('info', `[import] processing=${current.import.items.processing} active-batches=${current.import.activeBatches}`)
  }

  if (current.viewCount.jobs.processing !== previous.viewCount.jobs.processing) {
    pushWorkerActivity('info', `[views] processing=${current.viewCount.jobs.processing}`)
  }

  if (current.embedding.jobs.failed > previous.embedding.jobs.failed) {
    pushWorkerActivity('error', `[embedding] failed jobs=${current.embedding.jobs.failed} ${compactError(current.embedding.latestFailure)}`)
  }

  if (
    current.embedding.coveragePercent === 100
    && previous.embedding.coveragePercent < 100
  ) {
    pushWorkerActivity('success', `[embedding] coverage reached 100% (${current.embedding.embeddedArticles}/${current.embedding.publishedArticles})`)
  }

  previousWorkerSnapshot = {
    ...current,
    embedding: { ...current.embedding, jobs: { ...current.embedding.jobs } },
    import: { ...current.import, items: { ...current.import.items } },
    viewCount: { ...current.viewCount, jobs: { ...current.viewCount.jobs } },
  }
}, { immediate: true })

const activityLines = computed<WorkerActivityEntry[]>(() => {
  if (workerActivityLog.value.length > 0) {
    return workerActivityLog.value
  }

  return [
    {
      id: 'boot-awaiting',
      timestamp: dayjs().format('HH:mm:ss'),
      level: 'info',
      text: 'awaiting worker telemetry...',
    },
  ]
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

    <!-- Worker Debug Console -->
    <section class="overflow-hidden rounded-[18px] border border-dark-100 bg-[#040404] text-white shadow-product">

      <!-- Titlebar -->
      <div class="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div class="flex items-center gap-3">
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :class="clsx({
              'bg-[#87f0c1] shadow-[0_0_12px_rgba(135,240,193,0.9)]': embeddingWorkerMode() === 'idle',
              'bg-[#ffd58a] shadow-[0_0_12px_rgba(255,213,138,0.9)] animate-pulse': embeddingWorkerMode() === 'running',
              'bg-[#ff9f9f] shadow-[0_0_12px_rgba(255,159,159,0.9)] animate-pulse': embeddingWorkerMode() === 'blocked',
            })"
          />
          <span class="font-mono text-[13px] font-medium text-white">worker:all</span>
          <span
            class="rounded px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]"
            :class="clsx({
              'bg-[#87f0c1]/10 text-[#87f0c1]': embeddingWorkerMode() === 'idle',
              'bg-[#ffd58a]/10 text-[#ffd58a]': embeddingWorkerMode() === 'running',
              'bg-[#ff9f9f]/10 text-[#ff9f9f]': embeddingWorkerMode() === 'blocked',
            })"
          >{{ embeddingWorkerMode() }}</span>
        </div>

        <div class="flex items-center gap-4 font-mono text-[12px]">
          <template v-if="hasWorkerStatusSnapshot">
            <span class="tabular-nums text-slate-200">
              {{ workerStatus?.embedding.embeddedArticles }}/{{ workerStatus?.embedding.publishedArticles }}
              <span class="ml-1 text-slate-500">embedded</span>
            </span>
            <span class="text-slate-600">·</span>
            <span
              class="tabular-nums font-semibold"
              :class="workerStatus?.embedding.coveragePercent === 100 ? 'text-[#87f0c1]' : 'text-slate-300'"
            >{{ workerStatus?.embedding.coveragePercent ?? 0 }}%</span>
            <span class="text-slate-600">·</span>
            <span
              class="tabular-nums"
              :class="workerStatusRefreshing ? 'text-[#ffd58a]' : 'text-slate-500'"
            >{{ workerStatusRefreshing ? 'syncing...' : refreshTimeLabel(workerStatus?.refreshedAt) }}</span>
          </template>
          <template v-else>
            <span class="font-mono text-[12px] text-slate-600">connecting...</span>
          </template>
        </div>
      </div>

      <!-- Embedding progress bar (2px) -->
      <div class="h-0.5 bg-white/5">
        <div
          class="h-full transition-all duration-700"
          :class="workerStatus?.embedding.coveragePercent === 100 ? 'bg-[#87f0c1]' : 'bg-blue-400'"
          :style="{ width: `${workerStatus?.embedding.coveragePercent ?? 0}%` }"
        />
      </div>

      <!-- Log stream -->
      <div class="h-[340px] overflow-y-auto bg-[#020202] font-mono text-[13px] leading-6 text-slate-200">
        <div v-if="workerStatusInitialPending" class="flex h-full items-center justify-center">
          <span class="font-mono text-[13px] text-slate-600">connecting to worker telemetry...</span>
        </div>

        <template v-else>
          <div
            v-for="line in activityLines"
            :key="line.id"
            class="flex items-baseline gap-0 border-b border-white/[0.04] px-5 py-1.5 last:border-b-0 hover:bg-white/[0.02]"
          >
            <span class="mr-4 shrink-0 tabular-nums text-slate-600">{{ line.timestamp }}</span>
            <span
              class="mr-3 w-[58px] shrink-0 text-right text-[11px] uppercase tracking-[0.08em]"
              :class="clsx({
                'text-slate-600': line.level === 'info',
                'text-[#87f0c1]': line.level === 'success',
                'text-[#ffd58a]': line.level === 'warning',
                'text-[#ff9f9f]': line.level === 'error',
              })"
            >{{ line.level }}</span>
            <span
              class="min-w-0 break-words"
              :class="clsx({
                'text-slate-300': line.level === 'info',
                'text-[#87f0c1]': line.level === 'success',
                'text-[#ffd58a]': line.level === 'warning',
                'text-[#ff9f9f]': line.level === 'error',
              })"
            >{{ line.text }}</span>
          </div>
        </template>
      </div>

      <!-- Stats strip -->
      <div class="border-t border-white/10 bg-dark-950/60 px-5 py-3">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px]">
          <!-- Embedding -->
          <div class="flex items-center gap-2">
            <span class="text-slate-600">[emb]</span>
            <span class="text-slate-500">pending</span>
            <span :class="(workerStatus?.embedding.jobs.pending ?? 0) > 0 ? 'text-[#ffd58a]' : 'text-slate-400'">
              {{ workerStatus?.embedding.jobs.pending ?? 0 }}
            </span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-500">proc</span>
            <span :class="(workerStatus?.embedding.jobs.processing ?? 0) > 0 ? 'text-[#ffd58a]' : 'text-slate-400'">
              {{ workerStatus?.embedding.jobs.processing ?? 0 }}
            </span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-500">failed</span>
            <span :class="(workerStatus?.embedding.jobs.failed ?? 0) > 0 ? 'text-[#ff9f9f]' : 'text-slate-400'">
              {{ workerStatus?.embedding.jobs.failed ?? 0 }}
            </span>
          </div>
          <span class="hidden text-slate-700 lg:inline">|</span>
          <!-- Import -->
          <div class="flex items-center gap-2">
            <span class="text-slate-600">[imp]</span>
            <span class="text-slate-500">pending</span>
            <span :class="(workerStatus?.import.items.pending ?? 0) > 0 ? 'text-[#ffd58a]' : 'text-slate-400'">
              {{ workerStatus?.import.items.pending ?? 0 }}
            </span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-500">batches</span>
            <span :class="(workerStatus?.import.activeBatches ?? 0) > 0 ? 'text-[#ffd58a]' : 'text-slate-400'">
              {{ workerStatus?.import.activeBatches ?? 0 }}
            </span>
          </div>
          <span class="hidden text-slate-700 lg:inline">|</span>
          <!-- View count -->
          <div class="flex items-center gap-2">
            <span class="text-slate-600">[view]</span>
            <span class="text-slate-500">pending</span>
            <span :class="(workerStatus?.viewCount.jobs.pending ?? 0) > 0 ? 'text-[#ffd58a]' : 'text-slate-400'">
              {{ workerStatus?.viewCount.jobs.pending ?? 0 }}
            </span>
          </div>
          <span class="hidden text-slate-700 lg:inline">|</span>
          <!-- Latest failure inline -->
          <div v-if="workerStatus?.embedding.latestFailure" class="flex items-center gap-2">
            <span class="text-slate-600">[err]</span>
            <span class="max-w-[280px] truncate text-[#ff9f9f]">{{ compactError(workerStatus?.embedding.latestFailure) }}</span>
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
