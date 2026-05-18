import type { H3Event } from 'h3'
import type { CategoryDto } from '~/types/category'
import type { CategoryCreateInput, CategoryPatchInput } from '~/utils/validators/category'
import {
  findAllCategories,
  findCategoryBySlug,
  findAdminCategoryById,
  insertCategory,
  updateCategory,
  deleteCategory,
} from '../repositories/category.repository'

export async function listCategories(event: H3Event): Promise<CategoryDto[]> {
  return findAllCategories(event)
}

export async function getCategoryBySlug(event: H3Event, slug: string): Promise<CategoryDto> {
  const category = await findCategoryBySlug(event, slug)
  if (!category) {
    throw createApiError(404, 'NOT_FOUND', `Category '${slug}' not found`)
  }
  return category
}

export async function adminListCategories(event: H3Event): Promise<CategoryDto[]> {
  return findAllCategories(event)
}

export async function adminGetCategoryById(event: H3Event, id: string): Promise<CategoryDto> {
  const category = await findAdminCategoryById(event, id)
  if (!category) {
    throw createApiError(404, 'NOT_FOUND', `Category '${id}' not found`)
  }
  return category
}

export async function adminCreateCategory(
  event: H3Event,
  input: CategoryCreateInput,
): Promise<CategoryDto> {
  return insertCategory(event, input)
}

export async function adminUpdateCategory(
  event: H3Event,
  id: string,
  input: CategoryPatchInput,
): Promise<CategoryDto> {
  const updated = await updateCategory(event, id, input)
  if (!updated) {
    throw createApiError(404, 'NOT_FOUND', `Category '${id}' not found`)
  }
  return updated
}

export async function adminDeleteCategory(event: H3Event, id: string): Promise<void> {
  const deleted = await deleteCategory(event, id)
  if (!deleted) {
    throw createApiError(404, 'NOT_FOUND', `Category '${id}' not found`)
  }
}
