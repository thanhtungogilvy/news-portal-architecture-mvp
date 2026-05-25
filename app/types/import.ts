import type { CategoryDto } from '~/types/category'

export type ImportBatchStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed_with_failures'
  | 'failed'

export type ImportItemStatus = 'pending' | 'processing' | 'published' | 'failed'

export interface ImportBatchCountsDto {
  pending: number
  processing: number
  published: number
  failed: number
}

export interface ImportBatchDto {
  id: string
  categoryId: string
  category: CategoryDto | null
  createdBy: string | null
  sourceCount: number
  status: ImportBatchStatus
  counts: ImportBatchCountsDto
  failureEmailSentAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ImportItemNewsDto {
  id: string
  title: string
  slug: string
}

export interface ImportItemDto {
  id: string
  batchId: string
  sourceUrl: string
  status: ImportItemStatus
  attemptCount: number
  nextRetryAt: string
  lastError: string | null
  newsId: string | null
  news: ImportItemNewsDto | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ImportBatchDetailDto extends ImportBatchDto {
  items: ImportItemDto[]
}
