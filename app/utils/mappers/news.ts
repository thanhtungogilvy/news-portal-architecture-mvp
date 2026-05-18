import type { Tables } from '~/types/database.types'
import type { NewsDto, NewsStatus } from '~/types/news'
import type { CategoryDto } from '~/types/category'

export function mapNews(row: Tables<'news'>, category?: CategoryDto | null): NewsDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    thumbnailUrl: row.thumbnail_url,
    categoryId: row.category_id,
    category: category ?? null,
    authorId: row.author_id,
    status: row.status as NewsStatus,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
