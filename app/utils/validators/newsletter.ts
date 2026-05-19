import { z } from 'zod'

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>
