import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { mapNews } from '~/utils/mappers/news'
import { mapCategory } from '~/utils/mappers/category'
import type { NewsDto } from '~/types/news'
import type { NewsListQuery, AdminNewsListQuery, NewsCreateInput, NewsPatchInput } from '~/utils/validators/news'

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

// ─── Admin functions ─────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): NewsDto {
  const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
  return mapNews(row as Parameters<typeof mapNews>[0], category)
}

export async function findAdminNews(
  event: H3Event,
  opts: AdminNewsListQuery & { categoryId?: string },
): Promise<{ items: NewsDto[], total: number }> {
  const client = await serverSupabaseClient(event)
  const { page, limit, status, categoryId } = opts
  const offset = (page - 1) * limit

  let query = client
    .from('news')
    .select(NEWS_WITH_CATEGORY, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error, count } = await query

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch admin news')
  }

  return { items: (data ?? []).map(mapRow), total: count ?? 0 }
}

export async function findAdminNewsById(event: H3Event, id: string): Promise<NewsDto | null> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch news article')
  }

  return mapRow(data as Record<string, unknown>)
}

export async function insertNews(event: H3Event, input: NewsCreateInput & { authorId: string }): Promise<NewsDto> {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('news')
    .insert({
      title: input.title,
      slug: input.slug,
      summary: input.summary ?? null,
      content: input.content,
      thumbnail_url: input.thumbnailUrl ?? null,
      category_id: input.categoryId ?? null,
      author_id: input.authorId,
      status: input.status,
      published_at: input.publishedAt ?? null,
    })
    .select(NEWS_WITH_CATEGORY)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createApiError(409, 'CONFLICT', `News slug '${input.slug}' already exists`)
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to create news article')
  }

  return mapRow(data as Record<string, unknown>)
}

export async function updateNews(
  event: H3Event,
  id: string,
  input: NewsPatchInput,
): Promise<NewsDto | null> {
  const client = await serverSupabaseClient(event)

  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.slug !== undefined) patch.slug = input.slug
  if (input.summary !== undefined) patch.summary = input.summary
  if (input.content !== undefined) patch.content = input.content
  if (input.thumbnailUrl !== undefined) patch.thumbnail_url = input.thumbnailUrl
  if (input.categoryId !== undefined) patch.category_id = input.categoryId
  if (input.status !== undefined) patch.status = input.status
  if (input.publishedAt !== undefined) patch.published_at = input.publishedAt

  const { data, error } = await client
    .from('news')
    .update(patch)
    .eq('id', id)
    .select(NEWS_WITH_CATEGORY)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    if (error.code === '23505') {
      throw createApiError(409, 'CONFLICT', `News slug already exists`)
    }
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to update news article')
  }

  return mapRow(data as Record<string, unknown>)
}

export async function deleteNews(event: H3Event, id: string): Promise<boolean> {
  const client = await serverSupabaseClient(event)
  const { error, count } = await client
    .from('news')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to delete news article')
  }

  return (count ?? 0) > 0
}
