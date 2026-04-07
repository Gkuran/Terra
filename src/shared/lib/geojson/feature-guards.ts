import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'

export function isFeatureCollection(
  value: unknown,
): value is FeatureCollection<Geometry, GeoJsonProperties> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'FeatureCollection' &&
    'features' in value &&
    Array.isArray(value.features)
  )
}

export function isFeature(
  value: unknown,
): value is Feature<Geometry, GeoJsonProperties> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'Feature' &&
    'geometry' in value
  )
}
