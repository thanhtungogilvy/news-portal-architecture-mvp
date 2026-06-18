import type { H3Event } from 'h3'
import type { NewsDto, NewsDetailDto } from '~/types/news'
import type { NewsListQuery, AdminNewsListQuery, NewsCreateInput, NewsPatchInput } from '~/utils/validators/news'
import {
  findPublishedNews,
  findFeaturedNews,
  findMostViewedNews,
  findNewsBySlug,
  findAdjacentPublishedNews,
  findAdminNews,
  findAdminNewsById,
  insertNews,
  updateNews,
  deleteNews,
} from '../repositories/news.repository'
import { findCategoryBySlug } from '../repositories/category.repository'
import { queueViewCountJob } from './view-count-job.service'
import { serverSupabaseServiceRole } from '#supabase/server'
import { enqueueEmbeddingJob } from '../repositories/embedding-job.repository'

export async function listNews(
  event: H3Event,
  query: NewsListQuery,
): Promise<{ items: NewsDto[], total: number }> {
  let categoryId: string | undefined

  if (query.category) {
    const category = await findCategoryBySlug(event, query.category)
    if (!category) {
      throw createApiError(404, 'NOT_FOUND', `Category '${query.category}' not found`)
    }
    categoryId = category.id
  }

  return findPublishedNews(event, { ...query, categoryId })
}

export async function getFeaturedNews(event: H3Event): Promise<NewsDto[]> {
  return findFeaturedNews(event)
}

export async function getMostViewedNews(event: H3Event): Promise<NewsDto[]> {
  return findMostViewedNews(event)
}

export async function getNewsBySlug(event: H3Event, slug: string): Promise<NewsDetailDto> {
  const news = await findNewsBySlug(event, slug)
  if (!news) {
    throw createApiError(404, 'NOT_FOUND', `News '${slug}' not found`)
  }

  const navigation = await findAdjacentPublishedNews(event, news)

  return {
    ...news,
    navigation,
  }
}

export async function recordView(event: H3Event, id: string): Promise<void> {
  await queueViewCountJob(event, id)
}

// ─── Admin flows ──────────────────────────────────────────────────────────────

export async function adminListNews(
  event: H3Event,
  query: AdminNewsListQuery,
): Promise<{ items: NewsDto[], total: number }> {
  let categoryId: string | undefined
  if (query.category) {
    const category = await findCategoryBySlug(event, query.category)
    if (!category) {
      throw createApiError(404, 'NOT_FOUND', `Category '${query.category}' not found`)
    }
    categoryId = category.id
  }
  return findAdminNews(event, { ...query, categoryId })
}

export async function adminGetNewsById(event: H3Event, id: string): Promise<NewsDto> {
  const news = await findAdminNewsById(event, id)
  if (!news) {
    throw createApiError(404, 'NOT_FOUND', `News '${id}' not found`)
  }
  return news
}

export async function adminCreateNews(
  event: H3Event,
  input: NewsCreateInput,
  authorId: string,
): Promise<NewsDto> {
  const resolved: NewsCreateInput & { authorId: string } = { ...input, authorId }
  if (input.status === 'published' && !input.publishedAt) {
    resolved.publishedAt = new Date().toISOString()
  }
  const news = await insertNews(event, resolved)
  await fireAndForgetEmbeddingJob(event, news.id)
  return news
}

export async function adminUpdateNews(
  event: H3Event,
  id: string,
  input: NewsPatchInput,
): Promise<NewsDto> {
  const updated = await updateNews(event, id, input)
  if (!updated) {
    throw createApiError(404, 'NOT_FOUND', `News '${id}' not found`)
  }
  await fireAndForgetEmbeddingJob(event, updated.id)
  return updated
}

export async function adminDeleteNews(event: H3Event, id: string): Promise<void> {
  const deleted = await deleteNews(event, id)
  if (!deleted) {
    throw createApiError(404, 'NOT_FOUND', `News '${id}' not found`)
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Enqueue an embedding job for the given article.
 * Fire-and-forget: awaits the DB insert but never throws — failures are logged.
 */
async function fireAndForgetEmbeddingJob(event: H3Event, articleId: string): Promise<void> {
  try {
    const client = await serverSupabaseServiceRole(event)
    await enqueueEmbeddingJob(client, articleId)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[news.service] Failed to enqueue embedding job for article ${articleId}: ${message}`)
  }
}
