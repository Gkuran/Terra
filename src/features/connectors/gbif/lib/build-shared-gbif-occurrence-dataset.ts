import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { GbifOccurrenceDetail } from '@/features/connectors/gbif/api/request-gbif-occurrence-detail'
import { createConnectorDataset } from '@/features/connectors/lib/create-connector-dataset'

function parseCoordinate(value?: string | null) {
  if (!value) {
    return null
  }

  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : null
}

export function buildSharedGbifOccurrenceDataset(detail: GbifOccurrenceDetail) {
  const latitude = parseCoordinate(detail.rawAttributes.decimalLatitude)
  const longitude = parseCoordinate(detail.rawAttributes.decimalLongitude)

  if (latitude === null || longitude === null) {
    return null
  }

  const scientificName =
    detail.scientificName?.trim() || detail.canonicalName?.trim() || undefined
  const municipality =
    detail.municipality?.trim() || detail.stateProvince?.trim() || 'Not provided'
  const biome = detail.country?.trim() || 'GBIF'
  const kingdom = detail.taxonomy.kingdom?.trim() || detail.rawAttributes.kingdom?.trim() || ''
  const category =
    kingdom === 'Plantae' ? 'flora' : kingdom === 'Animalia' ? 'fauna' : detail.category
  const sourceName = scientificName ?? `GBIF occurrence ${detail.occurrenceKey}`
  const featureCollection: FeatureCollection<Geometry, FeatureProperties> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          id: `gbif-occurrence-${detail.occurrenceKey}`,
          title: sourceName,
          category,
          scientificName,
          biome,
          municipality,
          status: 'stable',
          summary: `Shared GBIF occurrence ${detail.occurrenceKey}.`,
          observedAt: detail.eventDate?.trim() || '',
          datasetId: 'gbif-shared-occurrence',
          rawAttributes: {
            ...detail.rawAttributes,
            occurrenceKey: String(detail.occurrenceKey),
            scientificName: scientificName ?? '',
            vernacularName: detail.vernacularName?.trim() || '',
            basisOfRecord: detail.basisOfRecord?.trim() || '',
            institutionCode: detail.institutionCode?.trim() || '',
            recordedBy: detail.recordedBy?.trim() || '',
            stateProvince: detail.stateProvince?.trim() || '',
            municipality: detail.municipality?.trim() || '',
            country: detail.country?.trim() || '',
            kingdom,
            hasMedia: detail.media.length > 0 ? 'true' : 'false',
            mediaCount: String(detail.media.length),
          },
        },
      },
    ],
  }

  return createConnectorDataset({
    collection: featureCollection,
    context: 'manual',
    label: sourceName,
    order: 0,
    provenance: {
      provider: 'GBIF',
      sourceName,
      recordCount: 1,
      queryLabel: `GBIF occurrence ${detail.occurrenceKey}`,
      queryParams: {
        occurrenceKey: String(detail.occurrenceKey),
      },
      notes: ['Imported from a BGSR shared occurrence link.'],
    },
    sourceType: 'gbif',
  })
}
