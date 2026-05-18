import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { mapCategory } from '~/utils/mappers/category'
import type { CategoryDto } from '~/types/category'
import type { CategoryCreateInput, CategoryPatchInput } from '~/utils/validators/category'

export async function findAllCategories(event: H3Event): Promise<CategoryDto[]> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch categories')
  }

  return data.map(mapCategory)
}

export async function findCategoryBySlug(event: H3Event, slug: string): Promise<CategoryDto | null> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch category')
  }

  return mapCategory(data)
}

export async function findAdminCategoryById(event: H3Event, id: string): Promise<CategoryDto | null> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch category')
  }

  return mapCategory(data)
}

export async function insertCategory(event: H3Event, input: CategoryCreateInput): Promise<CategoryDto> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('categories')
    .insert({ name: input.name, slug: input.slug })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createApiError(409, 'CONFLICT', `Category slug '${input.slug}' already exists`)
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to create category')
  }

  return mapCategory(data)
}

export async function updateCategory(
  event: H3Event,
  id: string,
  input: CategoryPatchInput,
): Promise<CategoryDto | null> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('categories')
    .update({ ...input })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    if (error.code === '23505') {
      throw createApiError(409, 'CONFLICT', `Category slug already exists`)
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to update category')
  }

  return mapCategory(data)
}

export async function deleteCategory(event: H3Event, id: string): Promise<boolean> {
  const client = await serverSupabaseClient(event)
  const { error, count } = await client
    .from('categories')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to delete category')
  }

  return (count ?? 0) > 0
}
