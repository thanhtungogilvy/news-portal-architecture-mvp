import { describe, expect, it } from 'vitest'
import { buildEmbeddingText } from '../../server/services/embedding.service'

describe('buildEmbeddingText', () => {
  it('includes all available lines and strips html', () => {
    const text = buildEmbeddingText({
      id: '1',
      title: 'Nuxt News',
      summary: 'Daily digest',
      content: '<p>Hello <strong>world</strong></p>',
      categoryName: 'Tech',
    })

    expect(text).toContain('Title: Nuxt News')
    expect(text).toContain('Summary: Daily digest')
    expect(text).toContain('Description: Hello world')
    expect(text).toContain('Category: Tech')
  })

  it('omits optional lines when values are absent', () => {
    const text = buildEmbeddingText({
      id: '2',
      title: 'Only Title',
      summary: null,
      content: '',
      categoryName: null,
    })

    expect(text).toBe('Title: Only Title')
    expect(text).not.toContain('Summary:')
    expect(text).not.toContain('Description:')
    expect(text).not.toContain('Category:')
  })
})
