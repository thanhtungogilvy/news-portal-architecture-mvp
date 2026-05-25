import type { CategoryDto } from '~/types/category'

export type NewsStatus = 'draft' | 'published' | 'archived'

export interface NewsDto {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  thumbnailUrl: string | null
  categoryId: string | null
  category: CategoryDto | null
  authorId: string | null
  authorName: string | null
  authorAvatarUrl: string | null
  status: NewsStatus
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NewsAdjacentDto {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  category: CategoryDto | null
  publishedAt: string | null
}

export interface NewsNavigationDto {
  newer: NewsAdjacentDto | null
  older: NewsAdjacentDto | null
}

export interface NewsDetailDto extends NewsDto {
  navigation: NewsNavigationDto
}
