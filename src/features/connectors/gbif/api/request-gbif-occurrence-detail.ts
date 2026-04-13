import { z } from 'zod'

import { getRequiredApiBaseUrl } from '@/shared/config/env'

const gbifOccurrenceMediaSchema = z.object({
  type: z.string(),
  format: z.string().nullable().optional(),
  identifier: z.url(),
  title: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  creator: z.string().nullable().optional(),
  rightsHolder: z.string().nullable().optional(),
  cachedUrl: z.url(),
})

const gbifOccurrenceTaxonomySchema = z.object({
  kingdom: z.string().nullable().optional(),
  phylum: z.string().nullable().optional(),
  order: z.string().nullable().optional(),
  family: z.string().nullable().optional(),
  genus: z.string().nullable().optional(),
  species: z.string().nullable().optional(),
})

const gbifOccurrenceDetailSchema = z.object({
  occurrenceKey: z.number(),
  scientificName: z.string().nullable().optional(),
  canonicalName: z.string().nullable().optional(),
  vernacularName: z.string().nullable().optional(),
  category: z.enum(['flora', 'fauna', 'dataset']),
  basisOfRecord: z.string().nullable().optional(),
  recordedBy: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  stateProvince: z.string().nullable().optional(),
  municipality: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  datasetName: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  institutionCode: z.string().nullable().optional(),
  collectionCode: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  references: z.string().nullable().optional(),
  gbifUrl: z.url(),
  taxonomy: gbifOccurrenceTaxonomySchema,
  media: z.array(gbifOccurrenceMediaSchema),
  rawAttributes: z.record(z.string(), z.string()),
})

const gbifOccurrenceDetailResponseSchema = z.object({
  source: z.literal('GBIF'),
  occurrence: gbifOccurrenceDetailSchema,
})

export type GbifOccurrenceDetail = z.infer<typeof gbifOccurrenceDetailSchema>

export function extractGbifOccurrenceKey(featureId: string, rawAttributes?: Record<string, string>) {
  const rawOccurrenceKey = rawAttributes?.occurrenceKey

  if (rawOccurrenceKey && /^\d+$/.test(rawOccurrenceKey)) {
    return Number(rawOccurrenceKey)
  }

  const match = featureId.match(/gbif-(?:bbox-)?occurrence-(\d+)$/)

  if (!match) {
    return null
  }

  return Number(match[1])
}

export async function requestGbifOccurrenceDetail(occurrenceKey: number) {
  const apiBaseUrl = getRequiredApiBaseUrl('GBIF occurrence detail requests')
  const response = await fetch(`${apiBaseUrl}/api/v1/occurrences/${occurrenceKey}`)

  if (!response.ok) {
    throw new Error('GBIF occurrence detail could not be loaded.')
  }

  const json = await response.json()
  const parsed = gbifOccurrenceDetailResponseSchema.parse(json)

  return parsed.occurrence
}
