import type { CategoryDto } from '~/types/category'
import type { CategoryCreateInput, CategoryPatchInput } from '~/utils/validators/category'
import type { ApiSuccess } from '~/types/api'

export function useAdminCategories() {
  const { data, status, error, refresh } = useFetch<ApiSuccess<CategoryDto[]>>(
    '/api/admin/categories',
    {
      key: 'admin-categories-list',
      server: false,
      default: () => ({ data: [] }),
    },
  )

  const categories = computed(() => data.value?.data ?? [])
  const pending = computed(() => status.value === 'pending' || status.value === 'idle')

  async function create(input: CategoryCreateInput) {
    await $fetch('/api/admin/categories', { method: 'POST', body: input })
    await refresh()
  }

  async function update(id: string, input: CategoryPatchInput) {
    await $fetch(`/api/admin/categories/${id}`, { method: 'PATCH', body: input })
    await refresh()
  }

  async function remove(id: string) {
    await $fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return { categories, pending, error, refresh, create, update, remove }
}
