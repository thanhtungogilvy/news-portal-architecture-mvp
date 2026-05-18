import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { mapNews } from '~/utils/mappers/news'
import { mapCategory } from '~/utils/mappers/category'
import type { NewsDto } from '~/types/news'
import type { NewsListQuery } from '~/utils/validators/news'

const NEWS_WITH_CATEGORY = '*, categories(*)' as const

export async function findPublishedNews(
  event: H3Event,
  opts: NewsListQuery & { categoryId?: string },
): Promise<{ items: NewsDto[], total: number }> {
  const client = await serverSupabaseClient(event)
  const { page, limit, categoryId } = opts
  const offset = (page - 1) * limit

  let query = client
    .from('news')
    .select(NEWS_WITH_CATEGORY, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error, count } = await query

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch news')
  }

  const items = (data ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return mapNews(row, category)
  })

  return { items, total: count ?? 0 }
}

export async function findFeaturedNews(event: H3Event, limit = 6): Promise<NewsDto[]> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch featured news')
  }

  return (data ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return mapNews(row, category)
  })
}

export async function findMostViewedNews(event: H3Event, limit = 6): Promise<NewsDto[]> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch most-viewed news')
  }

  return (data ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return mapNews(row, category)
  })
}

export async function findNewsBySlug(event: H3Event, slug: string): Promise<NewsDto | null> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch news article')
  }

  const category = data.categories ? mapCategory(data.categories as Parameters<typeof mapCategory>[0]) : null
  return mapNews(data, category)
}

export async function incrementViewCount(event: H3Event, id: string): Promise<void> {
  const client = await serverSupabaseServiceRole(event)
  const { data: found, error } = await client.rpc('increment_news_view_count', { news_id: id })

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to update view count')
  }

  if (!found) {
    throw createApiError(404, 'NOT_FOUND', 'News not found')
  }
}
