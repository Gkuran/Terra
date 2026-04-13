import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'

export type ConnectorSourceType = 'csv' | 'gbif' | 'shapefile' | 'macrostrat' | 'wosis'
export type ConnectorContext = 'bbox' | 'manual'
export type ConnectorDatasetTone =
  | 'copper'
  | 'moss'
  | 'ocean'
  | 'plum'
  | 'amber'
  | 'olive'

export type ConnectorDatasetProvider =
  | 'CSV'
  | 'GBIF'
  | 'Macrostrat'
  | 'Shapefile'
  | 'WoSIS'
  | 'Unknown'

export interface ConnectorDatasetProvenance {
  provider: ConnectorDatasetProvider
  sourceName: string
  importedAt: string
  recordCount: number
  queryLabel: string | null
  queryParams: Record<string, string>
  notes: string[]
}

export interface ConnectorDataset {
  id: string
  color: string
  importedAt: string
  isVisible: boolean
  label: string
  context: ConnectorContext
  sourceType: ConnectorSourceType
  tone: ConnectorDatasetTone
  provenance: ConnectorDatasetProvenance
  collection: FeatureCollection<Geometry, FeatureProperties>
}
