import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

interface InspectorNavigationContextInput {
  baseFeatures: FeatureCollection<Geometry, FeatureProperties>
  connectorDatasets: ConnectorDataset[]
  selectedFeature: Feature<Geometry, FeatureProperties> | null
}

export interface InspectorNavigationContext {
  currentIndex: number
  features: Array<Feature<Geometry, FeatureProperties>>
  total: number
}

export function getInspectorNavigationContext({
  baseFeatures,
  connectorDatasets,
  selectedFeature,
}: InspectorNavigationContextInput): InspectorNavigationContext | null {
  if (!selectedFeature) {
    return null
  }

  const selectedDatasetId = selectedFeature.properties.datasetId
  const connectorDataset = connectorDatasets.find(
    (dataset) => dataset.id === selectedDatasetId,
  )
  const scopedFeatures = connectorDataset
    ? connectorDataset.collection.features
    : baseFeatures.features
  const currentIndex = scopedFeatures.findIndex(
    (feature) => feature.properties.id === selectedFeature.properties.id,
  )

  if (currentIndex === -1) {
    return null
  }

  return {
    currentIndex,
    features: scopedFeatures,
    total: scopedFeatures.length,
  }
}
