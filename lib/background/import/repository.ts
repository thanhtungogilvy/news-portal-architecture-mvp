import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from '../../../app/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export type ImportItemRow = Tables<'import_items'>
export type ImportBatchRow = Tables<'import_batches'>

// ---------------------------------------------------------------------------
// Fetch items stuck in processing beyond the cutoff
// ---------------------------------------------------------------------------
export async function getStuckImportItems(
  client: AppSupabaseClient,
  stuckAfterMinutes = 10,
): Promise<ImportItemRow[]> {
  const cutoff = new Date(Date.now() - stuckAfterMinutes * 60 * 1000).toISOString()

  const { data, error } = await client
    .from('import_items')
    .select('*')
    .eq('status', 'processing')
    .lt('started_at', cutoff)

  if (error) throw new Error(`[import-repo] getStuckImportItems failed: ${error.message}`)
  return (data ?? []) as ImportItemRow[]
}

// ---------------------------------------------------------------------------
// Claim pending import items (atomically: pending → processing)
// ---------------------------------------------------------------------------
export async function claimPendingImportItems(
  client: AppSupabaseClient,
  batchSize: number,
): Promise<ImportItemRow[]> {
  const now = new Date().toISOString()

  // Step 1: select candidates
  const { data: candidates, error: selectError } = await client
    .from('import_items')
    .select('id, batch_id')
    .eq('status', 'pending')
    .lte('next_retry_at', now)
    .order('created_at')
    .limit(Math.max(batchSize, 1))

  if (selectError) throw new Error(`[import-repo] claim select failed: ${selectError.message}`)
  if (!candidates || candidates.length === 0) return []

  const ids = candidates.map((r) => r.id)

  // Step 2: update to processing atomically
  const { data, error: updateError } = await client
    .from('import_items')
    .update({ status: 'processing', started_at: now, updated_at: now })
    .in('id', ids)
    .eq('status', 'pending') // guard: only claim if still pending
    .select('*')

  if (updateError) throw new Error(`[import-repo] claim update failed: ${updateError.message}`)
  return (data ?? []) as ImportItemRow[]
}

// ---------------------------------------------------------------------------
// Mark item published — set status, news_id, finished_at
// ---------------------------------------------------------------------------
export async function markImportItemPublished(
  client: AppSupabaseClient,
  itemId: string,
  newsId: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await client
    .from('import_items')
    .update({ status: 'published', news_id: newsId, finished_at: now, updated_at: now, last_error: null })
    .eq('id', itemId)
  if (error) throw new Error(`[import-repo] mark published failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Schedule retry — back to pending with updated next_retry_at + attempt_count
// ---------------------------------------------------------------------------
export async function scheduleImportItemRetry(
  client: AppSupabaseClient,
  itemId: string,
  errorMsg: string,
  nextRetryAt: string,
  attemptCount: number,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await client
    .from('import_items')
    .update({
      status: 'pending',
      attempt_count: attemptCount,
      last_error: errorMsg,
      next_retry_at: nextRetryAt,
      finished_at: null,
      updated_at: now,
    })
    .eq('id', itemId)
  if (error) throw new Error(`[import-repo] schedule retry failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Mark item terminal failed
// ---------------------------------------------------------------------------
export async function markImportItemFailed(
  client: AppSupabaseClient,
  itemId: string,
  errorMsg: string,
  attemptCount: number,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await client
    .from('import_items')
    .update({
      status: 'failed',
      attempt_count: attemptCount,
      last_error: errorMsg,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', itemId)
  if (error) throw new Error(`[import-repo] mark failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Find an already-published import item for a given source URL
// (used to deduplicate: reuse news_id instead of scraping again)
// ---------------------------------------------------------------------------
export async function findPublishedImportByUrl(
  client: AppSupabaseClient,
  sourceUrl: string,
): Promise<{ news_id: string } | null> {
  const { data, error } = await client
    .from('import_items')
    .select('news_id')
    .eq('source_url', sourceUrl)
    .eq('status', 'published')
    .not('news_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`[import-repo] findPublishedImportByUrl failed: ${error.message}`)
  if (!data?.news_id) return null
  return { news_id: data.news_id }
}

// ---------------------------------------------------------------------------
// Insert DLQ item for terminal failures
// ---------------------------------------------------------------------------
export async function insertImportDlqItem(
  client: AppSupabaseClient,
  input: TablesInsert<'import_dlq_items'>,
): Promise<void> {
  const { error } = await client.from('import_dlq_items').insert(input)
  if (error) throw new Error(`[import-repo] insert DLQ failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Sync batch status from its items (call after each item completes)
// ---------------------------------------------------------------------------
export async function syncBatchStatus(
  client: AppSupabaseClient,
  batchId: string,
): Promise<void> {
  const { data, error } = await client
    .from('import_items')
    .select('status')
    .eq('batch_id', batchId)

  if (error) throw new Error(`[import-repo] syncBatchStatus fetch failed: ${error.message}`)
  if (!data || data.length === 0) return

  const counts = { pending: 0, processing: 0, published: 0, failed: 0 }
  for (const row of data) {
    const s = row.status as keyof typeof counts
    if (s in counts) counts[s] += 1
  }

  // Determine batch status
  const active = counts.pending + counts.processing
  let newStatus: string

  if (active > 0) {
    newStatus = 'processing'
  } else if (counts.failed === 0) {
    newStatus = 'completed'
  } else if (counts.published === 0) {
    newStatus = 'failed'
  } else {
    newStatus = 'completed_with_failures'
  }

  const { error: updateError } = await client
    .from('import_batches')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', batchId)
  if (updateError) throw new Error(`[import-repo] syncBatchStatus update failed: ${updateError.message}`)
}

// ---------------------------------------------------------------------------
// Find terminal batches that still need a completion alert email
// ---------------------------------------------------------------------------
export async function findBatchesNeedingFailureAlert(
  client: AppSupabaseClient,
): Promise<ImportBatchRow[]> {
  const { data, error } = await client
    .from('import_batches')
    .select('*')
    .in('status', ['completed', 'failed', 'completed_with_failures'])
    .is('failure_email_sent_at', null)

  if (error) throw new Error(`[import-repo] findBatchesNeedingAlert failed: ${error.message}`)
  return (data ?? []) as ImportBatchRow[]
}

// ---------------------------------------------------------------------------
// Get item status counts for a batch
// ---------------------------------------------------------------------------
export async function getItemCountsForBatch(
  client: AppSupabaseClient,
  batchId: string,
): Promise<{ pending: number, processing: number, published: number, failed: number }> {
  const { data, error } = await client
    .from('import_items')
    .select('status')
    .eq('batch_id', batchId)

  if (error) throw new Error(`[import-repo] getItemCounts failed: ${error.message}`)
  const counts = { pending: 0, processing: 0, published: 0, failed: 0 }
  for (const row of data ?? []) {
    const s = row.status as keyof typeof counts
    if (s in counts) counts[s] += 1
  }
  return counts
}

// ---------------------------------------------------------------------------
// Mark batch failure email sent
// ---------------------------------------------------------------------------
export async function markBatchFailureEmailSent(
  client: AppSupabaseClient,
  batchId: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await client
    .from('import_batches')
    .update({ failure_email_sent_at: now, updated_at: now })
    .eq('id', batchId)
  if (error) throw new Error(`[import-repo] markBatchFailureEmailSent failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Get failed items for a batch (for alert body)
// ---------------------------------------------------------------------------
export async function getFailedItemsForBatch(
  client: AppSupabaseClient,
  batchId: string,
): Promise<Array<{ source_url: string, last_error: string | null, attempt_count: number }>> {
  const { data, error } = await client
    .from('import_items')
    .select('source_url, last_error, attempt_count')
    .eq('batch_id', batchId)
    .eq('status', 'failed')

  if (error) throw new Error(`[import-repo] getFailedItems failed: ${error.message}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Find existing news by slug (for slug-based dedup)
// ---------------------------------------------------------------------------
export async function findNewsBySlugForImport(
  client: AppSupabaseClient,
  slug: string,
): Promise<{ id: string } | null> {
  const { data, error } = await client
    .from('news')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(`[import-repo] findNewsBySlug failed: ${error.message}`)
  return data ? { id: data.id } : null
}

// ---------------------------------------------------------------------------
// Insert news directly (worker context, no H3Event)
// ---------------------------------------------------------------------------
export interface NewsInsertInput {
  title: string
  slug: string
  summary: string | null
  content: string
  thumbnailUrl: string | null
  categoryId: string | null
  authorName: string | null
  status: string
  publishedAt: string
}

export async function insertNewsForImport(
  client: AppSupabaseClient,
  input: NewsInsertInput,
): Promise<{ id: string, slug: string }> {
  const { data, error } = await client
    .from('news')
    .insert({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      content: input.content,
      thumbnail_url: input.thumbnailUrl,
      category_id: input.categoryId,
      author_name: input.authorName,
      status: input.status,
      published_at: input.publishedAt,
    })
    .select('id, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`SLUG_CONFLICT:${input.slug}`)
    }
    throw new Error(`[import-repo] insertNews failed: ${error.message}`)
  }

  return { id: data.id, slug: data.slug }
}

// ---------------------------------------------------------------------------
// Get batch by id (for context during processing)
// ---------------------------------------------------------------------------
export async function getImportBatch(
  client: AppSupabaseClient,
  batchId: string,
): Promise<{ id: string, category_id: string, created_by: string | null } | null> {
  const { data, error } = await client
    .from('import_batches')
    .select('id, category_id, created_by')
    .eq('id', batchId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`[import-repo] getImportBatch failed: ${error.message}`)
  }
  return data
}
