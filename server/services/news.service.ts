import type { H3Event } from 'h3'
import type { NewsDto } from '~/types/news'
import type { NewsListQuery } from '~/utils/validators/news'
import {
  findPublishedNews,
  findFeaturedNews,
  findMostViewedNews,
  findNewsBySlug,
  incrementViewCount,
} from '../repositories/news.repository'
import { findCategoryBySlug } from '../repositories/category.repository'

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

export async function getNewsBySlug(event: H3Event, slug: string): Promise<NewsDto> {
  const news = await findNewsBySlug(event, slug)
  if (!news) {
    throw createApiError(404, 'NOT_FOUND', `News '${slug}' not found`)
  }
  return news
}

export async function recordView(event: H3Event, id: string): Promise<void> {
  await incrementViewCount(event, id)
}
