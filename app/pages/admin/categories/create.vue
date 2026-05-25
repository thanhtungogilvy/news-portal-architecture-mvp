<script setup lang="ts">
import type { CategoryCreateInput } from '~/utils/validators/category'
import type { ApiSuccess } from '~/types/api'
import type { CategoryDto } from '~/types/category'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { show } = useAdminToast()
const router = useRouter()

const submitting = ref(false)
const serverErrors = ref<Record<number, string>>({})
const batchFormRef = ref<{ setRowError: (i: number, field: keyof CategoryCreateInput, msg: string) => void } | null>(null)

async function onSubmit(rows: CategoryCreateInput[]) {
  submitting.value = true
  serverErrors.value = {}

  try {
    const res = await $fetch<ApiSuccess<CategoryDto[]>>('/api/admin/categories/batch', {
      method: 'POST',
      body: rows,
    })

    show(`${res.data.length} ${res.data.length === 1 ? 'category' : 'categories'} created successfully.`, 'success')
    router.push('/admin/categories')
  }
  catch (err: unknown) {
    const apiErr = err as { data?: { error?: { code?: string; message?: string } } }
    if (apiErr?.data?.error?.code === 'CONFLICT') {
      // Try to surface which slug conflicted
      const conflictMsg = apiErr.data.error.message ?? 'Slug already exists.'
      // Find which row has the conflicting slug mentioned in the message
      const slugMatch = conflictMsg.match(/slug[:\s"']+([a-z0-9-]+)/i)
      if (slugMatch && batchFormRef.value) {
        const conflictSlug = slugMatch[1]
        const idx = rows.findIndex(r => r.slug === conflictSlug)
        if (idx !== -1) {
          batchFormRef.value.setRowError(idx, 'slug', 'This slug is already in use.')
          submitting.value = false
          return
        }
      }
      show('One or more slugs already exist. Please change them and try again.', 'error')
    }
    else {
      show('Failed to create categories.', 'error')
    }
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
      <h1 class="text-2xl font-bold text-title">Create Categories</h1>
      <p class="mt-1 text-sm text-body">Add one or more categories at once.</p>
    </div>

    <div class="max-w-xl">
      <AdminBatchCategoryForm
        ref="batchFormRef"
        :loading="submitting"
        :server-errors="serverErrors"
        @submit="onSubmit"
        @cancel="router.push('/admin/categories')"
      />
    </div>
  </div>
</template>
