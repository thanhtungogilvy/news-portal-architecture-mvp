import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { ImportBatchCountsDto, ImportBatchDto, ImportBatchDetailDto, ImportItemDto } from '~/types/import'
import type { Tables, TablesInsert } from '~/types/database.types'
import type { ImportBatchDetailQuery, ImportBatchListQuery } from '~/utils/validators/import'
import { mapCategory } from '~/utils/mappers/category'

const BATCH_WITH_CATEGORY = '*, categories(*)' as const
const ITEM_WITH_NEWS = '*, news(id,title,slug)' as const

type ImportBatchRow = Tables<'import_batches'>
type ImportItemRow = Tables<'import_items'>

function emptyCounts(): ImportBatchCountsDto {
  return { pending: 0, processing: 0, published: 0, failed: 0 }
}

function mapBatchRow(row: ImportBatchRow & { categories?: unknown }, counts: ImportBatchCountsDto): ImportBatchDto {
  const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null

  return {
    id: row.id,
    categoryId: row.category_id,
    category,
    createdBy: row.created_by,
    sourceCount: row.source_count,
    status: row.status as ImportBatchDto['status'],
    counts,
    failureEmailSentAt: row.failure_email_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItemRow(row: ImportItemRow & { news?: { id: string, title: string, slug: string } | null }): ImportItemDto {
  return {
    id: row.id,
    batchId: row.batch_id,
    sourceUrl: row.source_url,
    status: row.status as ImportItemDto['status'],
    attemptCount: row.attempt_count,
    nextRetryAt: row.next_retry_at,
    lastError: row.last_error,
    newsId: row.news_id,
    news: row.news ? { id: row.news.id, title: row.news.title, slug: row.news.slug } : null,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function aggregateCounts(items: Array<Pick<ImportItemRow, 'status'>>): ImportBatchCountsDto {
  return items.reduce((counts, item) => {
    if (item.status === 'pending') counts.pending += 1
    if (item.status === 'processing') counts.processing += 1
    if (item.status === 'published') counts.published += 1
    if (item.status === 'failed') counts.failed += 1
    return counts
  }, emptyCounts())
}

export async function insertImportBatch(
  event: H3Event,
  input: TablesInsert<'import_batches'>,
): Promise<ImportBatchDto> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('import_batches')
    .insert(input)
    .select(BATCH_WITH_CATEGORY)
    .single()

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to create import batch')
  }

  return mapBatchRow(data as ImportBatchRow & { categories?: Record<string, unknown> | null }, emptyCounts())
}

export async function insertImportItems(
  event: H3Event,
  items: Array<TablesInsert<'import_items'>>,
): Promise<ImportItemDto[]> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('import_items')
    .insert(items)
    .select(ITEM_WITH_NEWS)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to create import items')
  }

  return (data ?? []).map((row) => mapItemRow(row as ImportItemRow & { news?: { id: string, title: string, slug: string } | null }))
}

async function findItemsByBatchIds(
  event: H3Event,
  batchIds: string[],
): Promise<Array<ImportItemRow>> {
  if (batchIds.length === 0) return []

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('import_items')
    .select('*')
    .in('batch_id', batchIds)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch import items')
  }

  return (data ?? []) as ImportItemRow[]
}

export async function findAdminImportBatches(
  event: H3Event,
  query: ImportBatchListQuery,
): Promise<{ items: ImportBatchDto[], total: number }> {
  const client = await serverSupabaseClient(event)
  const offset = (query.page - 1) * query.limit

  const { data, error, count } = await client
    .from('import_batches')
    .select(BATCH_WITH_CATEGORY, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + query.limit - 1)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch import batches')
  }

  const batchRows = (data ?? []) as Array<ImportBatchRow & { categories?: unknown }>
  const items = await findItemsByBatchIds(event, batchRows.map((row) => row.id))
  const countsByBatchId = new Map<string, ImportBatchCountsDto>()

  for (const item of items) {
    const counts = countsByBatchId.get(item.batch_id) ?? emptyCounts()
    if (item.status === 'pending') counts.pending += 1
    if (item.status === 'processing') counts.processing += 1
    if (item.status === 'published') counts.published += 1
    if (item.status === 'failed') counts.failed += 1
    countsByBatchId.set(item.batch_id, counts)
  }

  return {
    items: batchRows.map((row) => mapBatchRow(row, countsByBatchId.get(row.id) ?? emptyCounts())),
    total: count ?? 0,
  }
}

export async function findAdminImportBatchById(
  event: H3Event,
  id: string,
  query: ImportBatchDetailQuery,
): Promise<{ batch: ImportBatchDetailDto | null, totalItems: number }> {
  const client = await serverSupabaseClient(event)
  const { data: batchData, error: batchError } = await client
    .from('import_batches')
    .select(BATCH_WITH_CATEGORY)
    .eq('id', id)
    .maybeSingle()

  if (batchError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch import batch')
  }

  if (!batchData) return { batch: null, totalItems: 0 }

  const offset = (query.page - 1) * query.limit
  let itemsQuery = client
    .from('import_items')
    .select(ITEM_WITH_NEWS, { count: 'exact' })
    .eq('batch_id', id)
    .order('created_at', { ascending: true })
    .range(offset, offset + query.limit - 1)

  if (query.status) {
    itemsQuery = itemsQuery.eq('status', query.status)
  }

  const { data: itemData, error: itemError, count: filteredCount } = await itemsQuery

  if (itemError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch import batch items')
  }

  const { data: allItemStatuses, error: countsError } = await client
    .from('import_items')
    .select('status')
    .eq('batch_id', id)

  if (countsError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to aggregate import batch items')
  }

  const counts = aggregateCounts((allItemStatuses ?? []) as Array<Pick<ImportItemRow, 'status'>>)
  const batch = mapBatchRow(batchData as ImportBatchRow & { categories?: Record<string, unknown> | null }, counts)

  return {
    batch: {
      ...batch,
      items: (itemData ?? []).map((row) => mapItemRow(row as ImportItemRow & { news?: { id: string, title: string, slug: string } | null })),
    },
    totalItems: filteredCount ?? 0,
  }
}
