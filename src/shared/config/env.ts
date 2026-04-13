import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().optional(),
  VITE_MAP_STYLE_URL: z.url().optional(),
})

const parsedEnv = envSchema.parse(import.meta.env)

if (import.meta.env.PROD && !parsedEnv.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is required for production builds.')
}

export const env = parsedEnv

export function getRequiredApiBaseUrl(featureLabel: string) {
  if (!env.VITE_API_BASE_URL) {
    throw new Error(
      `VITE_API_BASE_URL is not configured for ${featureLabel}. Start the backend or provide the public API base URL.`,
    )
  }

  return env.VITE_API_BASE_URL
}
