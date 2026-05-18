import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { mapCategory } from '~/utils/mappers/category'
import type { CategoryDto } from '~/types/category'

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
