import { describe, expect, it } from 'vitest'
import { categoryCreateSchema } from '../../app/utils/validators/category'

describe('categoryCreateSchema', () => {
  it('accepts a valid name and slug', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech', slug: 'tech' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = categoryCreateSchema.safeParse({ name: '', slug: 'tech' })
    expect(result.success).toBe(false)
  })

  it('rejects a name exceeding 100 characters', () => {
    const result = categoryCreateSchema.safeParse({ name: 'a'.repeat(101), slug: 'tech' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with uppercase characters', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech', slug: 'Tech' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech News', slug: 'tech news' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with special characters', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech', slug: 'tech@news' })
    expect(result.success).toBe(false)
  })

  it('accepts slug with hyphens between words', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech News', slug: 'tech-news' })
    expect(result.success).toBe(true)
  })

  it('rejects slug exceeding 100 characters', () => {
    const result = categoryCreateSchema.safeParse({ name: 'Tech', slug: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })
})
