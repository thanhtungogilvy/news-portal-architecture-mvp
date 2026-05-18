import type { Tables } from '~/types/database.types'
import type { CategoryDto } from '~/types/category'

export function mapCategory(row: Tables<'categories'>): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
