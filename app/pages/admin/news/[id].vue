<script setup lang="ts">
import type { NewsCreateInput } from '~/utils/validators/news'
import type { ApiSuccess } from '~/types/api'
import type { CategoryDto } from '~/types/category'
import type { NewsDto } from '~/types/news'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { update } = useAdminNews()
const { show } = useAdminToast()

const id = computed(() => route.params.id as string)

const { data: articleData, error: articleError, status: articleStatus } = useFetch<ApiSuccess<NewsDto>>(
  () => `/api/admin/news/${id.value}`,
  { key: () => `admin-news-${id.value}`, server: false },
)

const { data: categoriesData } = useFetch<ApiSuccess<CategoryDto[]>>('/api/admin/categories', {
  key: 'admin-categories-for-news-edit',
  server: false,
  default: () => ({ data: [] }),
})

watch(articleError, (err) => { if (err) router.push('/admin/news') })

const categories = computed(() => categoriesData.value?.data ?? [])

const form = ref<NewsCreateInput>({
  title: '',
  slug: '',
  summary: null,
  content: '',
  thumbnailUrl: null,
  categoryId: null,
  status: 'draft',
  publishedAt: null,
})

watch(articleData, (val) => {
  const a = val?.data
  if (!a) return
  form.value = {
    title: a.title,
    slug: a.slug,
    summary: a.summary ?? null,
    content: a.content,
    thumbnailUrl: a.thumbnailUrl ?? null,
    categoryId: a.categoryId ?? null,
    status: a.status,
    publishedAt: a.publishedAt ?? null,
  }
}, { immediate: true })

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await update(id.value, form.value)
    show('Article updated successfully.', 'success')
    router.push('/admin/news')
  }
  catch {
    show('Failed to update article.', 'error')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/admin/news" class="text-sm text-body hover:text-title">← News Articles</NuxtLink>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-title">Edit Article</h1>
      <p v-if="articleData?.data?.title" class="mt-1 truncate text-sm text-body">{{ articleData.data.title }}</p>
    </div>

    <div >
      <UiSkeleton v-if="articleStatus === 'pending'" class="h-96 w-full rounded-xl" />
      <AdminNewsForm
        v-else
        v-model="form"
        :loading="submitting"
        :categories="categories"
        @submit="onSubmit"
        @cancel="router.push('/admin/news')"
      />
    </div>
  </div>
</template>
