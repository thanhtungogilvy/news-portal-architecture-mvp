import { describe, expect, it } from 'vitest'
import {
  importBulkCreateSchema,
  importCrawlSchema,
  importBatchListQuerySchema,
  importBatchDetailQuerySchema,
} from '../../app/utils/validators/import'

// ---------------------------------------------------------------------------
// importBulkCreateSchema
// ---------------------------------------------------------------------------
describe('importBulkCreateSchema', () => {
  it('accepts valid urls + categoryId', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: ['https://example.com/article-1.html', 'https://example.com/article-2.html'],
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty urls array', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: [],
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 100 urls', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: Array.from({ length: 101 }, (_, i) => `https://example.com/article-${i}.html`),
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid URL in list', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: ['not-a-url'],
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID categoryId', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: ['https://example.com/article.html'],
      categoryId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 100 urls', () => {
    const result = importBulkCreateSchema.safeParse({
      urls: Array.from({ length: 100 }, (_, i) => `https://example.com/article-${i}.html`),
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// importCrawlSchema
// ---------------------------------------------------------------------------
describe('importCrawlSchema', () => {
  it('accepts valid listing url + categoryId', () => {
    const result = importCrawlSchema.safeParse({
      url: 'https://vnexpress.net/the-gioi',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('defaults maxItems to 20', () => {
    const result = importCrawlSchema.safeParse({
      url: 'https://vnexpress.net/the-gioi',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.maxItems).toBe(20)
  })

  it('coerces string maxItems to number', () => {
    const result = importCrawlSchema.safeParse({
      url: 'https://vnexpress.net/the-gioi',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      maxItems: '50',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.maxItems).toBe(50)
  })

  it('rejects maxItems over 100', () => {
    const result = importCrawlSchema.safeParse({
      url: 'https://vnexpress.net/the-gioi',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      maxItems: 101,
    })
    expect(result.success).toBe(false)
  })

  it('rejects maxItems below 1', () => {
    const result = importCrawlSchema.safeParse({
      url: 'https://vnexpress.net/the-gioi',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      maxItems: 0,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// importBatchListQuerySchema
// ---------------------------------------------------------------------------
describe('importBatchListQuerySchema', () => {
  it('defaults page=1 limit=20', () => {
    const result = importBatchListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('rejects page < 1', () => {
    expect(importBatchListQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })

  it('rejects limit > 50', () => {
    expect(importBatchListQuerySchema.safeParse({ limit: 51 }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// importBatchDetailQuerySchema
// ---------------------------------------------------------------------------
describe('importBatchDetailQuerySchema', () => {
  it('accepts valid status filter', () => {
    const result = importBatchDetailQuerySchema.safeParse({ status: 'failed' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status value', () => {
    const result = importBatchDetailQuerySchema.safeParse({ status: 'unknown' })
    expect(result.success).toBe(false)
  })

  it('accepts missing status (optional)', () => {
    const result = importBatchDetailQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBeUndefined()
  })
})
