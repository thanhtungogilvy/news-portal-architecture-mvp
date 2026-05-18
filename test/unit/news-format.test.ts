import { describe, expect, it } from 'vitest'
import { formatCompactViewCount, formatNewsDate, formatViewCount } from '../../app/utils/format/news'

describe('news formatting helpers', () => {
  it('returns an empty string for a missing publish date', () => {
    expect(formatNewsDate(null)).toBe('')
  })

  it('formats the publish date consistently for news metadata', () => {
    expect(formatNewsDate('2026-05-18T12:00:00+07:00')).toBe('18/05/2026')
  })

  it('formats compact view counts for dense card layouts', () => {
    expect(formatCompactViewCount(1200)).toBe('1.2K')
    expect(formatCompactViewCount(98450)).toBe('98.4K')
  })

  it('formats full view counts for detail-page metadata', () => {
    expect(formatViewCount(15234)).toBe('15.234')
  })
})
