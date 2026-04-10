import type { FeatureCollection, Point } from 'geojson'
import { z } from 'zod'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'

const gbifOccurrenceSchema = z.object({
  key: z.number(),
  scientificName: z.string().optional(),
  decimalLatitude: z.number(),
  decimalLongitude: z.number(),
  eventDate: z.string().optional(),
  basisOfRecord: z.string().optional(),
  institutionCode: z.string().optional(),
  recordedBy: z.string().optional(),
  stateProvince: z.string().optional(),
  municipality: z.string().optional(),
  country: z.string().optional(),
  kingdom: z.string().optional(),
  issues: z.array(z.string()).optional(),
})

const gbifResponseSchema = z.object({
  results: z.array(gbifOccurrenceSchema),
  count: z.number(),
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
}: GbifConnectorInput): Promise<FeatureCollection<Point, FeatureProperties>> {
  const searchParams = new URLSearchParams({
    scientificName,
    country,
    hasCoordinate: 'true',
    limit: `${limit}`,
  })

  if (stateProvince) {
    searchParams.set('stateProvince', stateProvince)
  }

  const response = await fetch(
    `https://api.gbif.org/v1/occurrence/search?${searchParams.toString()}`,
  )

  if (!response.ok) {
    throw new Error('GBIF request failed. Try adjusting the species or region filters.')
  }

  const json = await response.json()
  const parsed = gbifResponseSchema.parse(json)

  if (parsed.results.length === 0) {
    throw new Error('GBIF returned no georeferenced occurrences for the selected filters.')
  }

  return {
    type: 'FeatureCollection',
    features: parsed.results.map((occurrence, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [occurrence.decimalLongitude, occurrence.decimalLatitude],
      },
      properties: {
        id: `gbif-occurrence-${occurrence.key}`,
        title: occurrence.scientificName ?? `GBIF occurrence ${index + 1}`,
        category:
          occurrence.kingdom === 'Plantae'
            ? 'flora'
            : occurrence.kingdom === 'Animalia'
              ? 'fauna'
              : 'dataset',
        scientificName: occurrence.scientificName,
        biome: occurrence.country ?? 'GBIF',
        municipality:
          occurrence.municipality ??
          occurrence.stateProvince ??
          'Not provided',
        status: 'stable',
        summary: `Imported from GBIF occurrence ${occurrence.key}.`,
        observedAt: occurrence.eventDate ?? new Date().toISOString(),
        datasetId: 'gbif-connector',
        rawAttributes: {
          occurrenceKey: `${occurrence.key}`,
          scientificName: occurrence.scientificName ?? '',
          basisOfRecord: occurrence.basisOfRecord ?? '',
          institutionCode: occurrence.institutionCode ?? '',
          recordedBy: occurrence.recordedBy ?? '',
          stateProvince: occurrence.stateProvince ?? '',
          municipality: occurrence.municipality ?? '',
          country: occurrence.country ?? '',
          kingdom: occurrence.kingdom ?? '',
          issues: occurrence.issues?.join(', ') ?? '',
        },
      },
    })),
  }
}
