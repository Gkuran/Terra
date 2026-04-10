import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

export function buildVisibleSessionFeatures<TGeometry extends Geometry>(
  features: FeatureCollection<TGeometry, FeatureProperties>,
  connectorDatasets: ConnectorDataset[],
): Array<Feature<Geometry, FeatureProperties>> {
  return [
    ...features.features,
    ...connectorDatasets.flatMap((dataset) =>
      dataset.isVisible ? dataset.collection.features : [],
    ),
  ]
}
