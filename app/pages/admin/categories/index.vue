<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { categories, pending, remove } = useAdminCategories()
const { show } = useAdminToast()
const router = useRouter()

const deleteTargetId = ref<string | null>(null)
const deleteModalOpen = ref(false)

function onEdit(id: string) {
  router.push(`/admin/categories/${id}`)
}

function onDeleteRequest(id: string) {
  deleteTargetId.value = id
  deleteModalOpen.value = true
}

async function onDeleteConfirm() {
  if (!deleteTargetId.value) return
  try {
    await remove(deleteTargetId.value)
    show('Category deleted.', 'success')
  }
  catch {
    show('Failed to delete category.', 'error')
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
        <h1 class="text-2xl font-bold text-title">Categories</h1>
        <p class="mt-1 text-sm text-body">Manage content categories.</p>
      </div>
      <NuxtLink to="/admin/categories/create">
        <UiButton>Create Category</UiButton>
      </NuxtLink>
    </div>

    <AdminCategoryTable
      :categories="categories"
      :loading="pending"
      @edit="onEdit"
      @delete="onDeleteRequest"
    />

    <UiModal
      v-model:open="deleteModalOpen"
      title="Delete Category"
      confirm-label="Delete"
      confirm-variant="destructive"
      @confirm="onDeleteConfirm"
    >
      Are you sure you want to delete this category? This action cannot be undone.
    </UiModal>
  </div>
</template>
