import type { FeatureCollection, Geometry } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { GbifOccurrenceFilters } from '@/features/connectors/lib/gbif-occurrence-filters'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { ConnectorQueryHistoryEntry } from '@/features/connectors/types/connector-query-history'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import type { MapSelection } from '@/features/map/types/map-selection'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'

interface BuildBgsrSessionExportInput {
  activePanel: 'layers' | null
  activeTool: 'inspect' | 'bbox'
  connectorDatasets: ConnectorDataset[]
  dataset: DatasetMetadata
  environmentalLayers: EnvironmentalLayer[]
  environmentalProbeCoordinates: [number, number] | null
  features: FeatureCollection<Geometry, FeatureProperties>
  gbifOccurrenceFilters: GbifOccurrenceFilters
  hoveredFeatureId: string | null
  includeGbifInAreaQuery: boolean
  includeMacrostratInAreaQuery: boolean
  isClimbingModeEnabled: boolean
  isResultsCollapsed: boolean
  layerOpacityById: Record<string, number>
  layerVisibilityById: Record<string, boolean>
  layers: LayerMetadata[]
  recentQueries: ConnectorQueryHistoryEntry[]
  selection: MapSelection | null
  uploadHistory: UploadResult[]
  visibleFeatureCount: number
}

export function buildBgsrSessionExport({
  activePanel,
  activeTool,
  connectorDatasets,
  dataset,
  environmentalLayers,
  environmentalProbeCoordinates,
  features,
  gbifOccurrenceFilters,
  hoveredFeatureId,
  includeGbifInAreaQuery,
  includeMacrostratInAreaQuery,
  isClimbingModeEnabled,
  isResultsCollapsed,
  layerOpacityById,
  layerVisibilityById,
  layers,
  recentQueries,
  selection,
  uploadHistory,
  visibleFeatureCount,
}: BuildBgsrSessionExportInput) {
  const exportedAt = new Date().toISOString()

  return {
    format: 'bgsr-session',
    version: 1,
    application: {
      acronym: 'BGSR',
      name: 'Biodiversity and Geoscience Session Recorder',
    },
    exportedAt,
    dataset,
    map: {
      activePanel,
      activeTool,
      environmentalProbeCoordinates,
      hoveredFeatureId,
      isClimbingModeEnabled,
      selection,
      visibleFeatureCount,
    },
    areaQuery: {
      includeGbif: includeGbifInAreaQuery,
      includeMacrostrat: includeMacrostratInAreaQuery,
      isResultsCollapsed,
      gbifFilters: gbifOccurrenceFilters,
    },
    layers: {
      base: layers.map((layer) => ({
        ...layer,
        isVisible: layerVisibilityById[layer.id] ?? layer.isVisibleByDefault,
        opacity: layerOpacityById[layer.id] ?? layer.defaultOpacity,
      })),
      environmental: environmentalLayers,
    },
    sessionData: {
      baseFeatures: features,
      connectorDatasets,
      recentQueries,
      uploadHistory,
    },
    summary: {
      baseFeatureCount: features.features.length,
      connectorDatasetCount: connectorDatasets.length,
      environmentalLayerCount: environmentalLayers.length,
      uploadHistoryCount: uploadHistory.length,
      visibleBaseLayerCount: layers.filter(
        (layer) => layerVisibilityById[layer.id] ?? layer.isVisibleByDefault,
      ).length,
    },
  }
}
