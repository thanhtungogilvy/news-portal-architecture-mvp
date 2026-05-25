import { describe, expect, it } from 'vitest'
import { generateSlug } from '../../lib/background/import/scraper'

describe('generateSlug', () => {
  it('converts ASCII title to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('strips Vietnamese diacritics', () => {
    expect(generateSlug('Thời tiết hôm nay')).toBe('thoi-tiet-hom-nay')
  })

  it('converts đ/Đ to d/D', () => {
    expect(generateSlug('Đà Nẵng đẹp')).toBe('da-nang-dep')
  })

  it('handles mixed Vietnamese and numbers', () => {
    const slug = generateSlug('Top 10 bài hát hay nhất 2026')
    expect(slug).toBe('top-10-bai-hat-hay-nhat-2026')
  })

  it('removes special characters', () => {
    expect(generateSlug('Tin tức: [Mới nhất]!')).toBe('tin-tuc-moi-nhat')
  })

  it('collapses multiple spaces/hyphens', () => {
    expect(generateSlug('Tin  tức   mới')).toBe('tin-tuc-moi')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  - hello - ')).toBe('hello')
  })

  it('truncates to 100 chars', () => {
    const long = 'a'.repeat(150)
    expect(generateSlug(long).length).toBeLessThanOrEqual(100)
  })

  it('returns fallback for empty input', () => {
    expect(generateSlug('')).toBe('article')
    expect(generateSlug('   ')).toBe('article')
  })

  it('returns fallback for non-latin-only symbols', () => {
    expect(generateSlug('!!!')).toBe('article')
  })

  it('does not append random suffix', () => {
    const slug = generateSlug('Bài viết hay')
    // Should be deterministic — same input always same output
    expect(slug).toBe(generateSlug('Bài viết hay'))
    // No timestamp or random segment (no 8+ char hex/base36 suffix after final hyphen)
    expect(slug).not.toMatch(/-[a-z0-9]{7,}$/)
  })
})
