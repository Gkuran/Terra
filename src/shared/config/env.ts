import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().optional(),
  VITE_MAP_STYLE_URL: z.url().optional(),
})

export const env = envSchema.parse(import.meta.env)
