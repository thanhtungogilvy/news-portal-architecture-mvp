<script setup lang="ts">
import type { CategoryCreateInput } from '~/utils/validators/category'
import type { ApiSuccess } from '~/types/api'
import type { CategoryDto } from '~/types/category'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { update } = useAdminCategories()
const { show } = useAdminToast()

const id = computed(() => route.params.id as string)

const { data, error, status } = useFetch<ApiSuccess<CategoryDto>>(
  () => `/api/admin/categories/${id.value}`,
  { key: () => `admin-category-${id.value}`, server: false },
)

watch(error, (err) => { if (err) router.push('/admin/categories') })

const form = ref<CategoryCreateInput>({ name: '', slug: '' })

watch(data, (val) => {
  if (val?.data) form.value = { name: val.data.name, slug: val.data.slug }
}, { immediate: true })

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await update(id.value, form.value)
    show('Category updated successfully.', 'success')
  }
  catch {
    show('Failed to update category.', 'error')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/admin/categories" class="text-sm text-body hover:text-title">← Categories</NuxtLink>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-title">Edit Category</h1>
      <p class="mt-1 text-sm text-body">Update this category's details.</p>
    </div>

    <div class="max-w-xl">
      <UiSkeleton v-if="status === 'pending'" class="h-48 w-full rounded-xl" />
      <AdminCategoryForm
        v-else
        v-model="form"
        :loading="submitting"
        @submit="onSubmit"
        @cancel="router.push('/admin/categories')"
      />
    </div>
  </div>
</template>
