import type { Feature, Geometry, Position } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'

function collectCoordinates(geometry: Geometry): Position[] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates]
    case 'Polygon':
      return geometry.coordinates.flat()
    case 'MultiPolygon':
      return geometry.coordinates.flat(2)
    default:
      return []
  }
}

export function getFeatureFocusCoordinates(
  feature: Feature<Geometry, FeatureProperties>,
): [number, number] | null {
  const coordinates = collectCoordinates(feature.geometry)

  if (coordinates.length === 0) {
    return null
  }

  if (feature.geometry.type === 'Point') {
    const [lng, lat] = coordinates[0]
    return [lng, lat]
  }

  const lngValues = coordinates.map(([lng]) => lng)
  const latValues = coordinates.map(([, lat]) => lat)
  const minLng = Math.min(...lngValues)
  const maxLng = Math.max(...lngValues)
  const minLat = Math.min(...latValues)
  const maxLat = Math.max(...latValues)

  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}

export function formatFeatureCoordinates(
  feature: Feature<Geometry, FeatureProperties>,
): string | null {
  const coordinates = getFeatureFocusCoordinates(feature)

  if (!coordinates) {
    return null
  }

  return `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
}
