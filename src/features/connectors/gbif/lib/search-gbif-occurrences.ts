import type { FeatureCollection, Geometry } from 'geojson'
import { z } from 'zod'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { env } from '@/shared/config/env'

const GBIF_API_BASE_URL = 'https://api.gbif.org/v1'
const ANIMALIA_KINGDOM_KEY = '1'
const PLANTAE_KINGDOM_KEY = '6'

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

const gbifOccurrenceSchema = z.object({
  key: z.number(),
  scientificName: z.string().nullable().optional(),
  decimalLatitude: z.number(),
  decimalLongitude: z.number(),
  municipality: z.string().nullable().optional(),
  stateProvince: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  kingdom: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  basisOfRecord: z.string().nullable().optional(),
  institutionCode: z.string().nullable().optional(),
  recordedBy: z.string().nullable().optional(),
  media: z.array(z.unknown()).optional(),
  mediaType: z.array(z.string()).optional(),
  issues: z.array(z.string()).optional(),
})

const gbifSearchResponseSchema = z.object({
  endOfRecords: z.boolean().optional(),
  results: z.array(gbifOccurrenceSchema),
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
  const normalizedInput = {
    scientificName: scientificName.trim(),
    country: country.trim().toUpperCase(),
    stateProvince: stateProvince?.trim() ?? '',
    limit,
  }

  if (!normalizedInput.scientificName) {
    throw new Error('Scientific name is required for GBIF searches.')
  }

  if (!normalizedInput.country) {
    throw new Error('Country code is required for GBIF searches.')
  }

  if (!env.VITE_API_BASE_URL) {
    return searchGbifOccurrencesDirectly(normalizedInput)
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}/api/v1/occurrences/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedInput),
  })

  if (response.ok) {
    const json = await response.json()
    const parsed = gbifFilteredSearchResponseSchema.parse(json)

    return parsed.feature_collection as FeatureCollection<Geometry, FeatureProperties>
  }

  if (response.status === 404 || response.status === 405) {
    return searchGbifOccurrencesDirectly(normalizedInput)
  }

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

async function searchGbifOccurrencesDirectly({
  scientificName,
  country,
  stateProvince,
  limit,
}: Required<Pick<GbifConnectorInput, 'scientificName' | 'country' | 'limit'>> &
  Pick<GbifConnectorInput, 'stateProvince'>): Promise<
  FeatureCollection<Geometry, FeatureProperties>
> {
  const pageSize = Math.min(limit, 200)
  const collectedOccurrences: Array<z.infer<typeof gbifOccurrenceSchema>> = []
  let offset = 0
  let reachedEnd = false

  while (collectedOccurrences.length < limit && !reachedEnd) {
    const params = new URLSearchParams()
    params.set('scientificName', scientificName)
    params.set('hasCoordinate', 'true')
    params.append('kingdomKey', ANIMALIA_KINGDOM_KEY)
    params.append('kingdomKey', PLANTAE_KINGDOM_KEY)
    params.set('country', country)
    params.set('limit', String(pageSize))
    params.set('offset', String(offset))

    if (stateProvince && stateProvince.trim()) {
      params.set('stateProvince', stateProvince.trim())
    }

    const response = await fetch(`${GBIF_API_BASE_URL}/occurrence/search?${params.toString()}`)

    if (!response.ok) {
      throw new Error('GBIF request failed. Try adjusting the species or region filters.')
    }

    const json = await response.json()
    const parsed = gbifSearchResponseSchema.parse(json)

    collectedOccurrences.push(...parsed.results)
    reachedEnd = parsed.endOfRecords ?? parsed.results.length < pageSize
    offset += pageSize
  }

  const features = collectedOccurrences.slice(0, limit).map((occurrence, index) => {
    return mapGbifOccurrenceToFeature(occurrence, index + 1)
  })

  if (!features.length) {
    throw new Error('GBIF returned no georeferenced occurrences for the selected filters.')
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

function mapGbifOccurrenceToFeature(
  occurrence: z.infer<typeof gbifOccurrenceSchema>,
  index: number,
): {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: FeatureProperties
} {
  const municipality =
    occurrence.municipality?.trim() ||
    occurrence.stateProvince?.trim() ||
    'Not provided'
  const biome = occurrence.country?.trim() || 'GBIF'
  const kingdom = occurrence.kingdom?.trim() || ''
  const category =
    kingdom === 'Plantae' ? 'flora' : kingdom === 'Animalia' ? 'fauna' : 'dataset'
  const scientificName = occurrence.scientificName?.trim() || undefined
  const mediaCount = occurrence.media?.length ?? 0
  const hasMedia = mediaCount > 0 || (occurrence.mediaType?.length ?? 0) > 0

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [occurrence.decimalLongitude, occurrence.decimalLatitude],
    },
    properties: {
      id: `gbif-occurrence-${occurrence.key}`,
      title: scientificName ?? `GBIF occurrence ${index}`,
      category,
      scientificName,
      biome,
      municipality,
      status: 'stable',
      summary: `Imported from GBIF occurrence ${occurrence.key}.`,
      observedAt: occurrence.eventDate?.trim() || '',
      datasetId: 'gbif-connector',
      rawAttributes: {
        occurrenceKey: String(occurrence.key),
        scientificName: scientificName ?? '',
        basisOfRecord: occurrence.basisOfRecord?.trim() || '',
        hasMedia: hasMedia ? 'true' : 'false',
        mediaCount: String(mediaCount),
        institutionCode: occurrence.institutionCode?.trim() || '',
        recordedBy: occurrence.recordedBy?.trim() || '',
        stateProvince: occurrence.stateProvince?.trim() || '',
        municipality: occurrence.municipality?.trim() || '',
        country: occurrence.country?.trim() || '',
        kingdom,
        issues: occurrence.issues?.join(', ') || '',
      },
    },
  }
}
