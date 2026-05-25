import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../app/types/database.types'
import {
  claimPendingImportItems,
  markImportItemPublished,
  scheduleImportItemRetry,
  markImportItemFailed,
  insertImportDlqItem,
  syncBatchStatus,
  findBatchesNeedingFailureAlert,
  markBatchFailureEmailSent,
  getFailedItemsForBatch,
  getImportBatch,
  insertNewsForImport,
  findPublishedImportByUrl,
  findNewsBySlugForImport,
} from './repository.ts'
import { scrapeArticle, generateSlug } from './scraper.ts'
import { sendBatchFailureAlert } from './alert.ts'

type AppSupabaseClient = SupabaseClient<Database>

const MAX_RETRIES = 3

// Exponential backoff: attempt 1 → 1 min, attempt 2 → 5 min, attempt 3+ → terminal
const BACKOFF_MINUTES = [1, 5]

function nextRetryAt(attemptCount: number): string {
  const minutes = BACKOFF_MINUTES[attemptCount - 1] ?? BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1]!
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

// ---------------------------------------------------------------------------
// Process a single import item
// ---------------------------------------------------------------------------
async function processOneItem(
  client: AppSupabaseClient,
  item: {
    id: string
    batch_id: string
    source_url: string
    attempt_count: number
  },
): Promise<'published' | 'retried' | 'failed'> {
  const newAttemptCount = item.attempt_count + 1

  try {
    // 1. Dedup check — reuse news_id if this URL was already imported
    const existing = await findPublishedImportByUrl(client, item.source_url)
    if (existing) {
      await markImportItemPublished(client, item.id, existing.news_id)
      await syncBatchStatus(client, item.batch_id)
      console.warn(`[import-svc] dedup item ${item.id} → reused news ${existing.news_id}`)
      return 'published'
    }

    // 2. Fetch + extract article
    const scraped = await scrapeArticle(item.source_url)

    // 3. Get batch context (category_id)
    const batch = await getImportBatch(client, item.batch_id)
    if (!batch) throw new Error('Batch not found')

    // 4. Generate slug + insert news (with slug-based dedup + conflict retry)
    let slug = generateSlug(scraped.title)
    let news: { id: string, slug: string }

    // Check if a news article with this slug already exists
    const existingBySlug = await findNewsBySlugForImport(client, slug)
    if (existingBySlug) {
      news = { id: existingBySlug.id, slug }
      console.warn(`[import-svc] slug dedup item ${item.id} → reused news ${existingBySlug.id} (slug: ${slug})`)
    }
    else {
      try {
        news = await insertNewsForImport(client, {
          title: scraped.title,
          slug,
          summary: scraped.summary,
          content: scraped.content,
          thumbnailUrl: scraped.thumbnailUrl,
          categoryId: batch.category_id,
          authorName: scraped.authorName,
          status: 'published',
          publishedAt: new Date().toISOString(),
        })
      }
      catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.startsWith('SLUG_CONFLICT')) {
          // Race condition: slug was inserted between our check and insert
          // Re-check and reuse the existing news_id
          const raceExisting = await findNewsBySlugForImport(client, slug)
          if (raceExisting) {
            news = { id: raceExisting.id, slug }
          }
          else {
            // Truly different article with same slug — append suffix
            slug = `${generateSlug(scraped.title)}}`
            news = await insertNewsForImport(client, {
              title: scraped.title,
              slug,
              summary: scraped.summary,
              content: scraped.content,
              thumbnailUrl: scraped.thumbnailUrl,
              categoryId: batch.category_id,
              authorName: scraped.authorName,
              status: 'published',
              publishedAt: new Date().toISOString(),
            })
          }
        }
        else {
          throw err
        }
      }
    }

    // 5. Mark item published
    await markImportItemPublished(client, item.id, news.id)
    await syncBatchStatus(client, item.batch_id)

    console.warn(`[import-svc] published item ${item.id} → news ${news.id} (${news.slug})`)
    return 'published'
  }
  catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    if (newAttemptCount >= MAX_RETRIES) {
      // Terminal failure → DLQ
      await markImportItemFailed(client, item.id, errorMsg, newAttemptCount)
      await insertImportDlqItem(client, {
        item_id: item.id,
        batch_id: item.batch_id,
        source_url: item.source_url,
        failure_reason: errorMsg,
        attempt_count: newAttemptCount,
      })
      await syncBatchStatus(client, item.batch_id)
      console.warn(`[import-svc] terminal failure item ${item.id} (attempt ${newAttemptCount}): ${errorMsg}`)
      return 'failed'
    }
    else {
      // Retry later
      await scheduleImportItemRetry(
        client,
        item.id,
        errorMsg,
        nextRetryAt(newAttemptCount),
        newAttemptCount,
      )
      console.warn(`[import-svc] retry scheduled item ${item.id} (attempt ${newAttemptCount}): ${errorMsg}`)
      return 'retried'
    }
  }
}

// ---------------------------------------------------------------------------
// Process a batch of pending items
// ---------------------------------------------------------------------------
export async function processImportItems(
  client: AppSupabaseClient,
  batchSize = 5,
): Promise<{ claimed: number, published: number, retried: number, failed: number }> {
  const items = await claimPendingImportItems(client, batchSize)

  let published = 0
  let retried = 0
  let failed = 0

  for (const item of items) {
    const result = await processOneItem(client, item)
    if (result === 'published') published += 1
    else if (result === 'retried') retried += 1
    else failed += 1
  }

  return { claimed: items.length, published, retried, failed }
}

// ---------------------------------------------------------------------------
// Send consolidated failure alerts for all batches needing one
// ---------------------------------------------------------------------------
export async function processBatchAlerts(client: AppSupabaseClient): Promise<void> {
  const batches = await findBatchesNeedingFailureAlert(client)

  for (const batch of batches) {
    try {
      const failedItems = await getFailedItemsForBatch(client, batch.id)

      await sendBatchFailureAlert({
        batchId: batch.id,
        totalItems: batch.source_count,
        failedItems,
      })

      await markBatchFailureEmailSent(client, batch.id)
      console.warn(`[import-svc] failure alert sent for batch ${batch.id}`)
    }
    catch (err) {
      console.error(`[import-svc] alert failed for batch ${batch.id}`, err)
    }
  }
}
