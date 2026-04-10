import type { FeatureCollection, Geometry } from 'geojson'
import { z } from 'zod'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { env } from '@/shared/config/env'

const backendFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['dataset', 'flora', 'fauna']),
  scientificName: z.string().nullable().optional(),
  biome: z.string(),
  municipality: z.string(),
  status: z.literal('stable'),
  summary: z.string(),
  observedAt: z.string(),
  datasetId: z.string(),
  rawAttributes: z.record(z.string(), z.string()).default({}),
})

const backendFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: backendFeaturePropertiesSchema,
})

const gbifFilteredSearchResponseSchema = z.object({
  metadata: z.object({
    source: z.literal('GBIF'),
    search_mode: z.literal('filters'),
    result_count: z.number(),
    query_label: z.string(),
  }),
  feature_collection: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(backendFeatureSchema),
  }),
})

export interface GbifConnectorInput {
  scientificName: string
  country: string
  stateProvince?: string
  limit?: number
}

export async function searchGbifOccurrences({
  scientificName,
  country,
  stateProvince,
  limit = 200,
}: GbifConnectorInput): Promise<FeatureCollection<Geometry, FeatureProperties>> {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for GBIF connector queries.')
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}/api/v1/occurrences/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scientificName,
      country,
      stateProvince,
      limit,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const detail =
      errorPayload &&
      typeof errorPayload === 'object' &&
      'detail' in errorPayload &&
      typeof errorPayload.detail === 'string'
        ? errorPayload.detail
        : 'GBIF request failed. Try adjusting the species or region filters.'

    throw new Error(detail)
  }

  const json = await response.json()
  const parsed = gbifFilteredSearchResponseSchema.parse(json)

  return parsed.feature_collection as FeatureCollection<Geometry, FeatureProperties>
}
