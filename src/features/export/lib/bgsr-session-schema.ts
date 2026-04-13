import type { FeatureCollection, Geometry } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { ConnectorQueryHistoryEntry } from '@/features/connectors/types/connector-query-history'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import type { MapSelection } from '@/features/map/types/map-selection'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'
import { z } from 'zod'

const mapSelectionSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  featureId: z.string(),
  layerId: z.string(),
})

const connectorFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  category: z
    .enum(['flora', 'fauna', 'biome', 'soil', 'dataset', 'geology'])
    .optional(),
  scientificName: z.string().optional(),
  biome: z.string().optional(),
  municipality: z.string().optional(),
  status: z.enum(['stable', 'attention', 'critical']).optional(),
  summary: z.string().optional(),
  observedAt: z.string().optional(),
  datasetId: z.string(),
  rawAttributes: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const connectorFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.union([
    z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    z.object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
    }),
    z.object({
      type: z.literal('MultiPolygon'),
      coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
    }),
    z.object({
      type: z.literal('LineString'),
      coordinates: z.array(z.tuple([z.number(), z.number()])),
    }),
  ]),
  properties: connectorFeaturePropertiesSchema,
})

const featureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(connectorFeatureSchema),
})

const connectorDatasetProvenanceSchema = z.object({
  provider: z.enum(['CSV', 'GBIF', 'Macrostrat', 'Shapefile', 'WoSIS', 'Unknown']),
  sourceName: z.string(),
  importedAt: z.string(),
  recordCount: z.number(),
  queryLabel: z.string().nullable(),
  queryParams: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  notes: z.array(z.string()),
})

const connectorDatasetSchema = z.object({
  id: z.string(),
  color: z.string(),
  context: z.enum(['bbox', 'manual']),
  importedAt: z.string(),
  isVisible: z.boolean(),
  label: z.string(),
  sourceType: z.enum(['csv', 'gbif', 'shapefile', 'macrostrat', 'wosis']),
  tone: z.enum(['copper', 'moss', 'ocean', 'plum', 'amber', 'olive']),
  provenance: connectorDatasetProvenanceSchema,
  collection: featureCollectionSchema,
})

const connectorQueryHistoryEntrySchema = z.object({
  id: z.string(),
  context: z.enum(['bbox', 'manual']),
  recordedAt: z.string(),
  sourceType: z.enum(['csv', 'gbif', 'shapefile', 'macrostrat', 'wosis']),
  label: z.string(),
  provenance: connectorDatasetProvenanceSchema,
})

const uploadResultSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  featureCount: z.number(),
  importedAt: z.string(),
  status: z.enum(['success', 'error']),
  message: z.string(),
})

const environmentalLayerSchema = z.object({
  id: z.string(),
  type: z.literal('soilgrids'),
  provider: z.literal('ISRIC'),
  label: z.string(),
  description: z.string(),
  propertyId: z.string(),
  propertyLabel: z.string(),
  depthId: z.string(),
  depthLabel: z.string(),
  statisticId: z.string(),
  statisticLabel: z.string(),
  unit: z.string(),
  attribution: z.string(),
  tileUrlTemplate: z.string(),
  legend: z.object({
    url: z.string(),
  }),
  isVisible: z.boolean(),
  opacity: z.number().min(0).max(1),
})

const layerMetadataSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  geometryType: z.enum(['fill', 'line', 'circle']),
  color: z.string(),
  defaultOpacity: z.number(),
  isVisibleByDefault: z.boolean(),
  featureCount: z.number(),
  legendLabel: z.string(),
})

const exportedLayerMetadataSchema = layerMetadataSchema.extend({
  isVisible: z.boolean(),
  opacity: z.number(),
})

const datasetMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['flora', 'fauna', 'biome', 'soil']),
  regionLabel: z.string(),
  featureCount: z.number(),
  updatedAt: z.string(),
  status: z.enum(['ready', 'processing', 'draft']),
  tags: z.array(z.string()),
})

export const bgsrSessionSchema = z.object({
  format: z.literal('bgsr-session'),
  version: z.literal(1),
  application: z
    .object({
      acronym: z.literal('BGSR'),
      name: z.string(),
    })
    .optional(),
  exportedAt: z.string(),
  dataset: datasetMetadataSchema,
  map: z.object({
    activePanel: z.union([z.literal('layers'), z.null()]),
    activeTool: z.enum(['inspect', 'bbox']),
    environmentalProbeCoordinates: z.tuple([z.number(), z.number()]).nullable(),
    hoveredFeatureId: z.string().nullable(),
    isClimbingModeEnabled: z.boolean().optional(),
    selection: mapSelectionSchema.nullable(),
    visibleFeatureCount: z.number(),
  }),
  areaQuery: z.object({
    includeGbif: z.boolean(),
    includeMacrostrat: z.boolean(),
    isResultsCollapsed: z.boolean(),
    gbifFilters: z.object({
      basisOfRecord: z.string(),
      country: z.string(),
      includeFauna: z.boolean(),
      includeFlora: z.boolean(),
      requireImage: z.boolean(),
      stateProvince: z.string(),
      yearFrom: z.string(),
      yearTo: z.string(),
    }),
  }),
  layers: z.object({
    base: z.array(exportedLayerMetadataSchema),
    environmental: z.array(environmentalLayerSchema),
  }),
  sessionData: z.object({
    baseFeatures: featureCollectionSchema,
    connectorDatasets: z.array(connectorDatasetSchema),
    recentQueries: z.array(connectorQueryHistoryEntrySchema).default([]),
    uploadHistory: z.array(uploadResultSchema),
  }),
  summary: z.object({
    baseFeatureCount: z.number().optional(),
    connectorDatasetCount: z.number(),
    environmentalLayerCount: z.number(),
    uploadHistoryCount: z.number(),
    visibleBaseLayerCount: z.number().optional(),
  }),
})

export interface BgsrSessionImport {
  application?: {
    acronym: 'BGSR'
    name: string
  }
  areaQuery: {
    gbifFilters: {
      basisOfRecord: string
      country: string
      includeFauna: boolean
      includeFlora: boolean
      requireImage: boolean
      stateProvince: string
      yearFrom: string
      yearTo: string
    }
    includeGbif: boolean
    includeMacrostrat: boolean
    isResultsCollapsed: boolean
  }
  dataset: DatasetMetadata
  exportedAt: string
  format: 'bgsr-session'
  layers: {
    base: Array<LayerMetadata & { isVisible: boolean; opacity: number }>
    environmental: EnvironmentalLayer[]
  }
  map: {
    activePanel: 'layers' | null
    activeTool: 'inspect' | 'bbox'
    environmentalProbeCoordinates: [number, number] | null
    hoveredFeatureId: string | null
    isClimbingModeEnabled?: boolean
    selection: MapSelection | null
    visibleFeatureCount: number
  }
  sessionData: {
    baseFeatures: FeatureCollection<Geometry, FeatureProperties>
    connectorDatasets: ConnectorDataset[]
    recentQueries: ConnectorQueryHistoryEntry[]
    uploadHistory: UploadResult[]
  }
  summary: {
    baseFeatureCount?: number
    connectorDatasetCount: number
    environmentalLayerCount: number
    uploadHistoryCount: number
    visibleBaseLayerCount?: number
  }
  version: 1
}
