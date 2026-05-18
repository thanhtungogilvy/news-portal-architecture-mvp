import { z } from 'zod'

export const newsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: z.string().optional(),
})

export type NewsListQuery = z.infer<typeof newsListQuerySchema>
