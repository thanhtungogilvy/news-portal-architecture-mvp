import type { H3Event } from 'h3'
import type { CategoryDto } from '~/types/category'
import { findAllCategories, findCategoryBySlug } from '../repositories/category.repository'

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
