import type { FeatureCollection, Geometry } from 'geojson'
import { z } from 'zod'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { MapBoundingBox } from '@/features/map/types/map-bounding-box'
import { env } from '@/shared/config/env'

const backendFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.literal('geology'),
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
    type: z.enum(['Polygon', 'MultiPolygon']),
    coordinates: z.unknown(),
  }),
  properties: backendFeaturePropertiesSchema,
})

const bboxSearchResponseSchema = z.object({
  metadata: z.object({
    source: z.literal('Macrostrat'),
    search_mode: z.literal('bbox'),
    result_count: z.number(),
    query_label: z.string(),
  }),
  feature_collection: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(backendFeatureSchema),
  }),
})

export interface MacrostratBoundingBoxSearchResult {
  featureCollection: FeatureCollection<Geometry, FeatureProperties>
  queryLabel: string
  resultCount: number
}

export async function searchMacrostratGeologyByBbox(
  bbox: MapBoundingBox,
): Promise<MacrostratBoundingBoxSearchResult> {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for Macrostrat bbox searches.')
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}/api/v1/geology/macrostrat/search-by-bbox`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bbox: {
        min_lng: bbox.minLng,
        min_lat: bbox.minLat,
        max_lng: bbox.maxLng,
        max_lat: bbox.maxLat,
      },
      limit: 120,
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
        : 'Macrostrat bounding box search failed.'

    throw new Error(detail)
  }

  const json = await response.json()
  const parsed = bboxSearchResponseSchema.parse(json)

  return {
    featureCollection: parsed.feature_collection as FeatureCollection<
      Geometry,
      FeatureProperties
    >,
    queryLabel: parsed.metadata.query_label,
    resultCount: parsed.metadata.result_count,
  }
}
