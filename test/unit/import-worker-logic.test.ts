import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Pure logic extracted from syncBatchStatus (counts → batch status mapping)
// Tested without Supabase — same logic used in repository.ts
// ---------------------------------------------------------------------------
function deriveBatchStatus(counts: {
  pending: number
  processing: number
  published: number
  failed: number
}): string {
  const active = counts.pending + counts.processing
  if (active > 0) return 'processing'
  if (counts.failed === 0) return 'completed'
  if (counts.published === 0) return 'failed'
  return 'completed_with_failures'
}

describe('deriveBatchStatus', () => {
  it('returns "processing" when pending items remain', () => {
    expect(deriveBatchStatus({ pending: 3, processing: 0, published: 5, failed: 0 })).toBe('processing')
  })

  it('returns "processing" when items are being processed', () => {
    expect(deriveBatchStatus({ pending: 0, processing: 2, published: 5, failed: 0 })).toBe('processing')
  })

  it('returns "completed" when all items published', () => {
    expect(deriveBatchStatus({ pending: 0, processing: 0, published: 20, failed: 0 })).toBe('completed')
  })

  it('returns "failed" when all items failed', () => {
    expect(deriveBatchStatus({ pending: 0, processing: 0, published: 0, failed: 5 })).toBe('failed')
  })

  it('returns "completed_with_failures" when mix of published and failed', () => {
    expect(deriveBatchStatus({ pending: 0, processing: 0, published: 17, failed: 3 })).toBe('completed_with_failures')
  })

  it('returns "completed" for single-item batch that published', () => {
    expect(deriveBatchStatus({ pending: 0, processing: 0, published: 1, failed: 0 })).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// Resend alert idempotency — verify failure_email_sent_at prevents duplicates
// The alert query filters `.is('failure_email_sent_at', null)`,
// so batches with a non-null value are excluded.
// ---------------------------------------------------------------------------
describe('batch alert idempotency', () => {
  it('batches with failure_email_sent_at set are NOT returned by alert query', () => {
    const batches = [
      { id: 'a', status: 'completed_with_failures', failure_email_sent_at: '2026-05-26T00:00:00Z' },
      { id: 'b', status: 'completed', failure_email_sent_at: null },
      { id: 'c', status: 'failed', failure_email_sent_at: null },
      { id: 'd', status: 'completed', failure_email_sent_at: '2026-05-26T01:00:00Z' },
    ]

    // Simulate the repository query: terminal status + failure_email_sent_at is null
    const terminalStatuses = ['completed', 'failed', 'completed_with_failures']
    const pending = batches.filter(
      (b) => terminalStatuses.includes(b.status) && b.failure_email_sent_at === null,
    )

    expect(pending).toHaveLength(2)
    expect(pending.map((b) => b.id)).toEqual(['b', 'c'])
  })

  it('once failure_email_sent_at is set, batch is not re-alerted', () => {
    const batch = { id: 'x', status: 'completed', failure_email_sent_at: null }

    // Simulate marking sent
    const afterSend = { ...batch, failure_email_sent_at: '2026-05-26T00:00:00Z' }

    const terminalStatuses = ['completed', 'failed', 'completed_with_failures']
    const wouldAlert = (b: typeof afterSend) =>
      terminalStatuses.includes(b.status) && b.failure_email_sent_at === null

    expect(wouldAlert(batch)).toBe(true) // before mark → would send
    expect(wouldAlert(afterSend)).toBe(false) // after mark → skip
  })
})

// ---------------------------------------------------------------------------
// Non-retriable error detection (mirrors service.ts logic)
// ---------------------------------------------------------------------------
describe('non-retriable error classification', () => {
  function isNonRetriable(errorMsg: string): boolean {
    return (
      errorMsg.startsWith('Could not extract article')
      || errorMsg.startsWith('HTTP 4')
    )
  }

  it('classifies "Could not extract article content" as non-retriable', () => {
    expect(isNonRetriable('Could not extract article content')).toBe(true)
  })

  it('classifies "Could not extract article title" as non-retriable', () => {
    expect(isNonRetriable('Could not extract article title')).toBe(true)
  })

  it('classifies HTTP 4xx as non-retriable', () => {
    expect(isNonRetriable('HTTP 404 from https://example.com/article.html')).toBe(true)
    expect(isNonRetriable('HTTP 403 from https://example.com/article.html')).toBe(true)
  })

  it('classifies HTTP 5xx as retriable', () => {
    expect(isNonRetriable('HTTP 500 from https://example.com/article.html')).toBe(false)
    expect(isNonRetriable('HTTP 503 from https://example.com/article.html')).toBe(false)
  })

  it('classifies network errors as retriable', () => {
    expect(isNonRetriable('fetch failed: Connection refused')).toBe(false)
    expect(isNonRetriable('TimeoutError: The operation was aborted')).toBe(false)
  })
})
