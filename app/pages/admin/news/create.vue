<script setup lang="ts">
import type { NewsCreateInput } from '~/utils/validators/news'
import type { ApiSuccess } from '~/types/api'
import type { CategoryDto } from '~/types/category'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { create } = useAdminNews()
const { show } = useAdminToast()
const router = useRouter()

const { data: categoriesData } = await useFetch<ApiSuccess<CategoryDto[]>>('/api/admin/categories', {
  key: 'admin-categories-for-news-form',
  default: () => ({ data: [] }),
})
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

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await create(form.value)
    show('Article created successfully.', 'success')
    router.push('/admin/news')
  }
  catch {
    show('Failed to create article.', 'error')
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
      <h1 class="text-2xl font-bold text-title">Create Article</h1>
      <p class="mt-1 text-sm text-body">Write and publish a new news article.</p>
    </div>

    <div class="max-w-2xl">
      <AdminNewsForm
        v-model="form"
        :loading="submitting"
        :categories="categories"
        @submit="onSubmit"
        @cancel="router.push('/admin/news')"
      />
    </div>
  </div>
</template>
