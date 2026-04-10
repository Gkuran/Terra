import type { FeatureCollection, GeoJsonProperties, Geometry, Position } from 'geojson'

function visitCoordinates(
  coordinates: Position | Position[] | Position[][] | Position[][][],
  onPosition: (position: Position) => void,
) {
  if (!Array.isArray(coordinates[0])) {
    onPosition(coordinates as Position)
    return
  }

  for (const coordinate of coordinates as Array<
    Position | Position[] | Position[][]
  >) {
    visitCoordinates(
      coordinate as Position | Position[] | Position[][] | Position[][][],
      onPosition,
    )
  }
}

export function getFeatureCollectionBounds(
  collection: FeatureCollection<Geometry, GeoJsonProperties>,
) {
  let minLongitude = Infinity
  let minLatitude = Infinity
  let maxLongitude = -Infinity
  let maxLatitude = -Infinity

  function collectGeometryBounds(geometry: Geometry) {
    if (geometry.type === 'GeometryCollection') {
      for (const nestedGeometry of geometry.geometries) {
        collectGeometryBounds(nestedGeometry)
      }

      return
    }

    visitCoordinates(geometry.coordinates as never, ([longitude, latitude]) => {
      minLongitude = Math.min(minLongitude, longitude)
      minLatitude = Math.min(minLatitude, latitude)
      maxLongitude = Math.max(maxLongitude, longitude)
      maxLatitude = Math.max(maxLatitude, latitude)
    })
  }

  for (const feature of collection.features) {
    if (!feature.geometry) {
      continue
    }

    collectGeometryBounds(feature.geometry)
  }

  if (
    !Number.isFinite(minLongitude) ||
    !Number.isFinite(minLatitude) ||
    !Number.isFinite(maxLongitude) ||
    !Number.isFinite(maxLatitude)
  ) {
    return null
  }

  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ] as [[number, number], [number, number]]
}
