import { describe, expect, it } from 'vitest'
import { mapCategory } from '../../app/utils/mappers/category'
import type { Tables } from '../../app/types/database.types'

const baseRow: Tables<'categories'> = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Technology',
  slug: 'technology',
  created_at: '2026-05-18T00:00:00.000Z',
  updated_at: '2026-05-18T12:00:00.000Z',
}

describe('mapCategory', () => {
  it('maps all fields correctly', () => {
    const dto = mapCategory(baseRow)

    expect(dto.id).toBe(baseRow.id)
    expect(dto.name).toBe(baseRow.name)
    expect(dto.slug).toBe(baseRow.slug)
    expect(dto.createdAt).toBe(baseRow.created_at)
    expect(dto.updatedAt).toBe(baseRow.updated_at)
  })

  it('produces a DTO with exactly the expected keys', () => {
    const dto = mapCategory(baseRow)
    expect(Object.keys(dto).sort()).toEqual(['createdAt', 'id', 'name', 'slug', 'updatedAt'])
  })
})
