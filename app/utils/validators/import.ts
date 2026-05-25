import { z } from 'zod'

export const importItemStatusSchema = z.enum(['pending', 'processing', 'published', 'failed'])
export const importBatchStatusSchema = z.enum(['pending', 'processing', 'completed', 'completed_with_failures', 'failed'])

export const importBulkCreateSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(100),
  categoryId: z.string().uuid(),
})

export const importCrawlSchema = z.object({
  url: z.string().url(),
  categoryId: z.string().uuid(),
  maxItems: z.coerce.number().int().min(1).max(100).default(20),
})

export const importBatchListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const importBatchDetailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: importItemStatusSchema.optional(),
})

export type ImportItemStatus = z.infer<typeof importItemStatusSchema>
export type ImportBatchStatus = z.infer<typeof importBatchStatusSchema>
export type ImportBulkCreateInput = z.infer<typeof importBulkCreateSchema>
export type ImportCrawlInput = z.infer<typeof importCrawlSchema>
export type ImportBatchListQuery = z.infer<typeof importBatchListQuerySchema>
export type ImportBatchDetailQuery = z.infer<typeof importBatchDetailQuerySchema>
