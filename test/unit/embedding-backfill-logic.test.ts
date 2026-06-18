import { describe, expect, it } from 'vitest'
import { selectArticleIdsToEnqueue } from '../../server/services/embedding-backfill.service'

describe('selectArticleIdsToEnqueue', () => {
  it('excludes completed and processing jobs for idempotent backfill', () => {
    const published = ['a', 'b', 'c', 'd']
    const existing = [
      { article_id: 'a', status: 'completed' },
      { article_id: 'b', status: 'processing' },
      { article_id: 'x', status: 'failed' },
    ]

    const result = selectArticleIdsToEnqueue(published, existing)
    expect(result).toEqual(['c', 'd'])
  })

  it('allows re-enqueue for failed and pending jobs', () => {
    const published = ['a', 'b']
    const existing = [
      { article_id: 'a', status: 'failed' },
      { article_id: 'b', status: 'pending' },
    ]

    const result = selectArticleIdsToEnqueue(published, existing)
    expect(result).toEqual(['a', 'b'])
  })
})
