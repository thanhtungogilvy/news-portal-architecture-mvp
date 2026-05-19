import { z } from 'zod'

export const newsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: z.string().optional(),
  q: z.string().max(200).optional(),
})

export type NewsListQuery = z.infer<typeof newsListQuerySchema>

export const adminNewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional(),
})

export type AdminNewsListQuery = z.infer<typeof adminNewsListQuerySchema>

export const newsCreateSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  summary: z.string().max(1000).nullable().optional(),
  content: z.string().min(1),
  thumbnailUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  authorName: z.string().max(200).nullable().optional(),
  authorAvatarUrl: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
})

export const newsPatchSchema = newsCreateSchema.partial()

export type NewsCreateInput = z.infer<typeof newsCreateSchema>
export type NewsPatchInput = z.infer<typeof newsPatchSchema>

