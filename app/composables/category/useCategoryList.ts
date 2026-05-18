import type { CategoryDto } from '~/types/category'
import type { ApiSuccess } from '~/types/api'

export function useCategoryList() {
  const { data, status, error } = useFetch<ApiSuccess<CategoryDto[]>>('/api/categories', {
    key: 'categories-list',
    default: () => ({ data: [] }),
  })

  const categories = computed(() => data.value?.data ?? [])

  return { categories, status, error }
}
