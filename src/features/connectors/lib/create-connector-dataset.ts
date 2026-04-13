import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type {
  ConnectorContext,
  ConnectorDataset,
  ConnectorDatasetProvenance,
  ConnectorDatasetProvider,
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
  context: ConnectorContext
  label: string
  order: number
  provenance?: Partial<ConnectorDatasetProvenance>
  sourceType: ConnectorSourceType
}

const connectorDatasetProviders: Record<ConnectorSourceType, ConnectorDatasetProvider> = {
  csv: 'CSV',
  gbif: 'GBIF',
  macrostrat: 'Macrostrat',
  shapefile: 'Shapefile',
  wosis: 'WoSIS',
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

interface BuildConnectorDatasetProvenanceInput {
  context: ConnectorContext
  importedAt: string
  label: string
  recordCount: number
  sourceType: ConnectorSourceType
  provenance?: Partial<ConnectorDatasetProvenance>
}

export function buildConnectorDatasetProvenance({
  context,
  importedAt,
  label,
  recordCount,
  sourceType,
  provenance,
}: BuildConnectorDatasetProvenanceInput): ConnectorDatasetProvenance {
  return {
    provider: provenance?.provider ?? connectorDatasetProviders[sourceType] ?? 'Unknown',
    sourceName: provenance?.sourceName ?? label,
    importedAt: provenance?.importedAt ?? importedAt,
    recordCount: provenance?.recordCount ?? recordCount,
    queryLabel:
      provenance?.queryLabel ?? (context === 'bbox' || sourceType === 'gbif' ? label : null),
    queryParams: provenance?.queryParams ?? {},
    notes: provenance?.notes ?? [],
  }
}

export function ensureConnectorDatasetProvenance(
  dataset: Omit<ConnectorDataset, 'provenance'> & {
    provenance?: Partial<ConnectorDatasetProvenance>
  },
): ConnectorDataset {
  return {
    ...dataset,
    provenance: buildConnectorDatasetProvenance({
      context: dataset.context,
      importedAt: dataset.importedAt,
      label: dataset.label,
      recordCount: dataset.collection.features.length,
      sourceType: dataset.sourceType,
      provenance: dataset.provenance,
    }),
  }
}

export function createConnectorDataset({
  collection,
  context,
  label,
  order,
  provenance,
  sourceType,
}: CreateConnectorDatasetInput): ConnectorDataset {
  const timestamp = Date.now()
  const datasetId = `${sourceType}-${slugifyLabel(label) || 'dataset'}-${timestamp}`
  const paletteEntry = connectorDatasetPalette[order % connectorDatasetPalette.length]
  const importedAt = new Date(timestamp).toISOString()
  const prefixedCollection = prefixCollectionFeatures(collection, datasetId)

  return ensureConnectorDatasetProvenance({
    id: datasetId,
    color: paletteEntry.color,
    context,
    importedAt,
    isVisible: true,
    label,
    sourceType,
    tone: paletteEntry.tone,
    provenance,
    collection: prefixedCollection,
  })
}
