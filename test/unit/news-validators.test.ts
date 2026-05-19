import { describe, expect, it } from 'vitest'
import { newsCreateSchema, newsListQuerySchema, adminNewsListQuerySchema } from '../../app/utils/validators/news'

describe('newsCreateSchema', () => {
  it('accepts a valid full input', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello World',
      slug: 'hello-world',
      content: 'Body text here.',
      status: 'published',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = newsCreateSchema.safeParse({
      slug: 'hello-world',
      content: 'Body',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = newsCreateSchema.safeParse({
      title: '',
      slug: 'hello-world',
      content: 'Body',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug format (uppercase)', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello',
      slug: 'Hello-World',
      content: 'Body',
    })
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello',
      slug: 'hello world',
      content: 'Body',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid thumbnail URL', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello',
      slug: 'hello',
      content: 'Body',
      thumbnailUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts null thumbnail URL', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello',
      slug: 'hello',
      content: 'Body',
      thumbnailUrl: null,
    })
    expect(result.success).toBe(true)
  })

  it('defaults status to draft when omitted', () => {
    const result = newsCreateSchema.safeParse({
      title: 'Hello',
      slug: 'hello',
      content: 'Body',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('draft')
    }
  })
})

describe('newsListQuerySchema', () => {
  it('returns defaults when no params provided', () => {
    const result = newsListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(9)
    }
  })

  it('coerces string page and limit to numbers', () => {
    const result = newsListQuerySchema.safeParse({ page: '2', limit: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(5)
    }
  })

  it('rejects page=0', () => {
    const result = newsListQuerySchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects limit exceeding 50', () => {
    const result = newsListQuerySchema.safeParse({ limit: '51' })
    expect(result.success).toBe(false)
  })
})

describe('adminNewsListQuerySchema', () => {
  it('accepts valid status filter', () => {
    const result = adminNewsListQuerySchema.safeParse({ status: 'published' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown status value', () => {
    const result = adminNewsListQuerySchema.safeParse({ status: 'pending' })
    expect(result.success).toBe(false)
  })

  it('allows limit up to 100', () => {
    const result = adminNewsListQuerySchema.safeParse({ limit: '100' })
    expect(result.success).toBe(true)
  })
})
