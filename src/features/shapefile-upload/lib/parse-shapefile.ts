import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import shp from 'shpjs'
import { z } from 'zod'

import { isFeatureCollection } from '@/shared/lib/geojson/feature-guards'

const parsedGeoJsonSchema = z.custom<
  FeatureCollection<Geometry, GeoJsonProperties>
>(
  (value) => isFeatureCollection(value),
  {
    message: 'Uploaded shapefile data could not be converted to a valid GeoJSON feature collection.',
  },
)

export async function parseShapefileArchive(
  archiveBuffer: ArrayBuffer,
) {
  const parsed = await shp(archiveBuffer)

  return parsedGeoJsonSchema.parse(parsed)
}
