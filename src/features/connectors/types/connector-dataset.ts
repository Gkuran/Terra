import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'

export type ConnectorSourceType = 'csv' | 'gbif' | 'shapefile'
export type ConnectorDatasetTone =
  | 'copper'
  | 'moss'
  | 'ocean'
  | 'plum'
  | 'amber'
  | 'olive'

export interface ConnectorDataset {
  id: string
  color: string
  importedAt: string
  label: string
  sourceType: ConnectorSourceType
  tone: ConnectorDatasetTone
  collection: FeatureCollection<Geometry, FeatureProperties>
}
