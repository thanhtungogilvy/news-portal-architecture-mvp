import type { H3Event } from 'h3'
import type { ImportBatchDetailDto, ImportBatchDto } from '~/types/import'
import type { ImportBulkCreateInput, ImportCrawlInput, ImportBatchDetailQuery, ImportBatchListQuery } from '~/utils/validators/import'
import { findAdminCategoryById } from '../repositories/category.repository'
import {
  findAdminImportBatchById,
  findAdminImportBatches,
  insertImportBatch,
  insertImportItems,
} from '../repositories/import.repository'

function normalizeUrls(urls: string[]): string[] {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))]
}

export async function adminCreateImportBatch(
  event: H3Event,
  input: ImportBulkCreateInput,
  createdBy: string,
): Promise<{ batchId: string, accepted: number }> {
  const category = await findAdminCategoryById(event, input.categoryId)
  if (!category) {
    throw createApiError(404, 'NOT_FOUND', `Category '${input.categoryId}' not found`)
  }

  const urls = normalizeUrls(input.urls)
  if (urls.length === 0) {
    throw createApiError(422, 'VALIDATION_ERROR', 'At least one valid URL is required')
  }
  if (urls.length > 100) {
    throw createApiError(422, 'VALIDATION_ERROR', 'A maximum of 100 URLs is allowed')
  }

  const batch = await insertImportBatch(event, {
    category_id: category.id,
    created_by: createdBy,
    source_count: urls.length,
    status: 'pending',
  })

  await insertImportItems(
    event,
    urls.map((url) => ({
      batch_id: batch.id,
      source_url: url,
      status: 'pending',
    })),
  )

  return {
    batchId: batch.id,
    accepted: urls.length,
  }
}

export async function adminListImportBatches(
  event: H3Event,
  query: ImportBatchListQuery,
): Promise<{ items: ImportBatchDto[], total: number }> {
  return findAdminImportBatches(event, query)
}

export async function adminGetImportBatchById(
  event: H3Event,
  id: string,
  query: ImportBatchDetailQuery,
): Promise<{ batch: ImportBatchDetailDto, totalItems: number }> {
  const found = await findAdminImportBatchById(event, id, query)
  if (!found.batch) {
    throw createApiError(404, 'NOT_FOUND', `Import batch '${id}' not found`)
  }

  return found as { batch: ImportBatchDetailDto, totalItems: number }
}

export async function adminCrawlAndCreateImportBatch(
  event: H3Event,
  input: ImportCrawlInput,
  createdBy: string,
): Promise<{ batchId: string, accepted: number, discovered: number }> {
  const category = await findAdminCategoryById(event, input.categoryId)
  if (!category) {
    throw createApiError(404, 'NOT_FOUND', `Category '${input.categoryId}' not found`)
  }

  let urls: string[]
  let discovered: number
  try {
    const { extractArticleLinks } = await import('../../lib/background/import/scraper')
    const result = await extractArticleLinks(input.url, input.maxItems)
    urls = result.urls
    discovered = result.discovered
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.startsWith('HTTP 4')) {
      throw createApiError(422, 'CRAWL_FETCH_ERROR', `Could not fetch listing page: ${msg}`)
    }
    if (msg.startsWith('HTTP 5')) {
      throw createApiError(502, 'CRAWL_UPSTREAM_ERROR', `Listing page returned a server error: ${msg}`)
    }
    // Timeout or network failure
    throw createApiError(502, 'CRAWL_NETWORK_ERROR', `Failed to reach listing page: ${msg}`)
  }

  if (urls.length === 0) {
    throw createApiError(422, 'VALIDATION_ERROR', 'No article links found on the provided page')
  }

  const batch = await insertImportBatch(event, {
    category_id: category.id,
    created_by: createdBy,
    source_count: urls.length,
    status: 'pending',
  })

  await insertImportItems(
    event,
    urls.map((url) => ({
      batch_id: batch.id,
      source_url: url,
      status: 'pending',
    })),
  )

  return { batchId: batch.id, accepted: urls.length, discovered }
}
