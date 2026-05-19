import { describe, expect, it } from 'vitest'
import { mapNews } from '../../app/utils/mappers/news'
import type { Tables } from '../../app/types/database.types'
import type { CategoryDto } from '../../app/types/category'

const baseRow: Tables<'news'> = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: 'Test Article',
  slug: 'test-article',
  summary: 'A short summary.',
  content: '<p>Body content</p>',
  thumbnail_url: 'https://example.com/image.jpg',
  category_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  author_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  status: 'published',
  view_count: 42,
  published_at: '2026-05-19T08:00:00+07:00',
  created_at: '2026-05-19T00:00:00.000Z',
  updated_at: '2026-05-19T01:00:00.000Z',
}

const category: CategoryDto = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Technology',
  slug: 'technology',
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:00:00.000Z',
}

describe('mapNews', () => {
  it('maps all fields correctly with a category', () => {
    const dto = mapNews(baseRow, category)

    expect(dto.id).toBe(baseRow.id)
    expect(dto.title).toBe(baseRow.title)
    expect(dto.slug).toBe(baseRow.slug)
    expect(dto.summary).toBe(baseRow.summary)
    expect(dto.content).toBe(baseRow.content)
    expect(dto.thumbnailUrl).toBe(baseRow.thumbnail_url)
    expect(dto.categoryId).toBe(baseRow.category_id)
    expect(dto.category).toEqual(category)
    expect(dto.authorId).toBe(baseRow.author_id)
    expect(dto.status).toBe(baseRow.status)
    expect(dto.viewCount).toBe(baseRow.view_count)
    expect(dto.publishedAt).toBe(baseRow.published_at)
    expect(dto.createdAt).toBe(baseRow.created_at)
    expect(dto.updatedAt).toBe(baseRow.updated_at)
  })

  it('maps null category when no category provided', () => {
    const dto = mapNews(baseRow, null)
    expect(dto.category).toBeNull()
  })

  it('maps null category when category is undefined', () => {
    const dto = mapNews(baseRow, undefined)
    expect(dto.category).toBeNull()
  })

  it('maps nullable fields as null when they are null in the row', () => {
    const row: Tables<'news'> = {
      ...baseRow,
      summary: null,
      thumbnail_url: null,
      category_id: null,
      author_id: null,
      published_at: null,
    }
    const dto = mapNews(row, null)
    expect(dto.summary).toBeNull()
    expect(dto.thumbnailUrl).toBeNull()
    expect(dto.categoryId).toBeNull()
    expect(dto.authorId).toBeNull()
    expect(dto.publishedAt).toBeNull()
  })
})
