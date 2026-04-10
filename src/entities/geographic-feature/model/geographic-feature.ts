import type { Feature, GeoJsonProperties, Geometry } from 'geojson'

export type GeographicFeature = Feature<Geometry, GeoJsonProperties>

export type FeatureProperties = GeoJsonProperties & {
  id: string
  title: string
  category: 'flora' | 'fauna' | 'biome' | 'soil' | 'geology' | 'dataset'
  scientificName?: string
  biome: string
  municipality: string
  status: 'stable' | 'attention' | 'critical'
  summary: string
  observedAt: string
  datasetId: string
  rawAttributes?: Record<string, string>
}
