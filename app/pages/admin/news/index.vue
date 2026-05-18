<script setup lang="ts">
import type { NewsStatus } from '~/types/news'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const NEWS_STATUSES: NewsStatus[] = ['draft', 'published', 'archived']

function parseStatus(val: unknown): NewsStatus | undefined {
  return NEWS_STATUSES.includes(val as NewsStatus) ? (val as NewsStatus) : undefined
}

const statusFilter = ref<NewsStatus | undefined>(parseStatus(route.query.status))
const categoryFilter = ref<string | undefined>(typeof route.query.category === 'string' ? route.query.category : undefined)

watch(statusFilter, (val) => {
  router.replace({ query: { ...route.query, status: val ?? undefined, category: categoryFilter.value ?? undefined } })
})
watch(categoryFilter, (val) => {
  router.replace({ query: { ...route.query, status: statusFilter.value ?? undefined, category: val ?? undefined } })
})

const { news, pending, remove } = useAdminNews(statusFilter, categoryFilter)
const { categories, pending: categoriesPending } = useAdminCategories()
const { show } = useAdminToast()

const deleteTargetId = ref<string | null>(null)
const deleteModalOpen = ref(false)

function onEdit(id: string) {
  router.push(`/admin/news/${id}`)
}

function onDeleteRequest(id: string) {
  deleteTargetId.value = id
  deleteModalOpen.value = true
}

async function onDeleteConfirm() {
  if (!deleteTargetId.value) return
  try {
    await remove(deleteTargetId.value)
    show('Article deleted.', 'success')
  }
  catch {
    show('Failed to delete article.', 'error')
  }
  finally {
    deleteTargetId.value = null
  }
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-title">News Articles</h1>
        <p class="mt-1 text-sm text-body">Manage published and draft articles.</p>
      </div>
      <NuxtLink to="/admin/news/create">
        <UiButton>Create Article</UiButton>
      </NuxtLink>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="categoryFilter"
        :disabled="categoriesPending"
        class="rounded-lg border border-border bg-white px-3 py-2 text-sm text-title shadow-sm focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
      >
        <option :value="undefined">All Categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-lg border border-border bg-white px-3 py-2 text-sm text-title shadow-sm focus:outline-none focus:ring-2 focus:ring-blue"
      >
        <option :value="undefined">All Statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <AdminNewsTable
      :news="news"
      :loading="pending"
      @edit="onEdit"
      @delete="onDeleteRequest"
    />
    <UiModal
      v-model:open="deleteModalOpen"
      title="Delete Article"
      confirm-label="Delete"
      confirm-variant="destructive"
      @confirm="onDeleteConfirm"
    >
      Are you sure you want to permanently delete this article? This action cannot be undone.
    </UiModal>
  </div>
</template>
