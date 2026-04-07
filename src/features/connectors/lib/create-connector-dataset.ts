import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type {
  ConnectorDataset,
  ConnectorSourceType,
} from '@/features/connectors/types/connector-dataset'

const connectorDatasetPalette = [
  { color: '#8a5a36', tone: 'copper' },
  { color: '#4f7d4c', tone: 'moss' },
  { color: '#2f6f8f', tone: 'ocean' },
  { color: '#8a4d77', tone: 'plum' },
  { color: '#b36a2f', tone: 'amber' },
  { color: '#5b6f3a', tone: 'olive' },
] as const

interface CreateConnectorDatasetInput {
  collection: ConnectorDataset['collection']
  label: string
  order: number
  sourceType: ConnectorSourceType
}

function slugifyLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function prefixCollectionFeatures(
  collection: ConnectorDataset['collection'],
  datasetId: string,
): ConnectorDataset['collection'] {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature, index) => {
      const currentProperties = feature.properties
      const nextFeatureId =
        currentProperties.id.trim() !== ''
          ? `${datasetId}-${currentProperties.id}`
          : `${datasetId}-feature-${index + 1}`

      return {
        ...feature,
        properties: {
          ...(currentProperties as FeatureProperties),
          id: nextFeatureId,
          datasetId,
        },
      }
    }),
  }
}

export function createConnectorDataset({
  collection,
  label,
  order,
  sourceType,
}: CreateConnectorDatasetInput): ConnectorDataset {
  const timestamp = Date.now()
  const datasetId = `${sourceType}-${slugifyLabel(label) || 'dataset'}-${timestamp}`
  const paletteEntry = connectorDatasetPalette[order % connectorDatasetPalette.length]

  return {
    id: datasetId,
    color: paletteEntry.color,
    importedAt: new Date(timestamp).toISOString(),
    label,
    sourceType,
    tone: paletteEntry.tone,
    collection: prefixCollectionFeatures(collection, datasetId),
  }
}
