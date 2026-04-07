import type {
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import {
  readCandidate,
  stringifyAttributes,
} from '@/features/connectors/lib/connector-attribute-utils'

const titleCandidates = ['name', 'nome', 'nm_mun', 'municipio', 'nm_uf', 'sigla', 'id']
const municipalityCandidates = ['municipio', 'nm_mun', 'nome', 'name']
const biomeCandidates = ['bioma', 'biome', 'nm_uf', 'uf', 'estado', 'state']

export function normalizeUploadedFeatures(
  collection: FeatureCollection<Geometry, GeoJsonProperties>,
  sourceName: string,
): FeatureCollection<Geometry, FeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature, index) => {
      const rawAttributes = stringifyAttributes(feature.properties)
      const title =
        readCandidate(feature.properties, titleCandidates) ??
        `Imported feature ${index + 1}`

      return {
        ...feature,
        properties: {
          ...feature.properties,
          id: `uploaded-feature-${index + 1}`,
          title,
          category: 'dataset',
          scientificName:
            rawAttributes.scientificName ??
            rawAttributes.scientific_name ??
            undefined,
          biome:
            readCandidate(feature.properties, biomeCandidates) ?? 'Imported dataset',
          municipality:
            readCandidate(feature.properties, municipalityCandidates) ??
            'Not provided',
          status: 'stable',
          summary: `Imported from ${sourceName}.`,
          observedAt: new Date().toISOString(),
          datasetId: 'uploaded-shapefile',
          rawAttributes,
        },
      }
    }),
  }
}
