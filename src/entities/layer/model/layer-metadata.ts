export type LayerGeometryType = 'fill' | 'line' | 'circle'

export interface LayerMetadata {
  id: string
  datasetId: string
  name: string
  description?: string
  geometryType: LayerGeometryType
  color: string
  defaultOpacity: number
  isVisibleByDefault: boolean
  featureCount: number
  legendLabel: string
}
