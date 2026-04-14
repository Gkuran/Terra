import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import shp from 'shpjs'
import { z } from 'zod'

import { isFeatureCollection } from '@/shared/lib/geojson/feature-guards'

interface ParsedShapefileCollection extends FeatureCollection<Geometry, GeoJsonProperties> {
  fileName?: string
}

const parsedGeoJsonSchema = z.custom<
  FeatureCollection<Geometry, GeoJsonProperties>
>(
  (value) => isFeatureCollection(value),
  {
    message: 'Uploaded shapefile data could not be converted to a valid GeoJSON feature collection.',
  },
)

export interface ParsedShapefileLayer {
  collection: FeatureCollection<Geometry, GeoJsonProperties>
  fileName: string | null
}

export async function parseShapefileArchive(
  archiveBuffer: ArrayBuffer,
) {
  const parsed = await shp(archiveBuffer)

  if (Array.isArray(parsed)) {
    const layers = parsed
      .filter(
        (value): value is ParsedShapefileCollection =>
          typeof value === 'object' && value !== null && isFeatureCollection(value),
      )
      .map((value) => ({
        collection: parsedGeoJsonSchema.parse(value),
        fileName: typeof value.fileName === 'string' ? value.fileName : null,
      }))

    if (layers.length === 0) {
      throw new Error(
        'Uploaded shapefile data could not be converted to a valid GeoJSON feature collection.',
      )
    }

    return layers
  }

  return [
    {
      collection: parsedGeoJsonSchema.parse(parsed),
      fileName: null,
    },
  ]
}
