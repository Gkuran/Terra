declare module 'shpjs' {
  import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'

  export default function shp(
    data: ArrayBuffer | Uint8Array,
  ): Promise<FeatureCollection<Geometry, GeoJsonProperties>>
}
