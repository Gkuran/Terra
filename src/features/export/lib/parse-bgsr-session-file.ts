import type { FeatureCollection, Geometry } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { ConnectorQueryHistoryEntry } from '@/features/connectors/types/connector-query-history'
import type { BgsrSessionImport } from '@/features/export/lib/bgsr-session-schema'
import { currentBgsrSessionVersion } from '@/features/export/lib/bgsr-session-version'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeQueryParams(value: unknown) {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, item === null ? '' : `${item}`]),
  )
}

function normalizeRawAttributes(value: unknown) {
  if (!isRecord(value)) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, item === null ? '' : `${item}`]),
  )
}

function isGeometry(value: unknown): value is Geometry {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  return 'coordinates' in value || value.type === 'GeometryCollection'
}

function normalizeFeatureCollection(value: unknown): FeatureCollection<Geometry, FeatureProperties> {
  const collection = isRecord(value) ? value : {}
  const features = Array.isArray(collection.features) ? collection.features : []

  return {
    type: 'FeatureCollection',
    features: features
      .filter((feature): feature is UnknownRecord => isRecord(feature))
      .map((feature, index) => {
        const properties = isRecord(feature.properties) ? feature.properties : {}

        return {
          type: 'Feature',
          geometry: isGeometry(feature.geometry)
            ? feature.geometry
            : {
                type: 'Point',
                coordinates: [0, 0],
              },
          properties: {
            id: asString(properties.id, `imported-feature-${index + 1}`),
            title: asString(properties.title, asString(properties.scientificName, 'Imported feature')),
            category:
              properties.category === 'flora' ||
              properties.category === 'fauna' ||
              properties.category === 'biome' ||
              properties.category === 'soil' ||
              properties.category === 'dataset' ||
              properties.category === 'geology'
                ? properties.category
                : 'dataset',
            scientificName: asString(properties.scientificName, undefined),
            biome: asString(properties.biome),
            municipality: asString(properties.municipality),
            status:
              properties.status === 'attention' || properties.status === 'critical'
                ? properties.status
                : 'stable',
            summary: asString(properties.summary),
            observedAt: asString(properties.observedAt),
            datasetId: asString(properties.datasetId, 'imported-session'),
            rawAttributes: normalizeRawAttributes(properties.rawAttributes),
          },
        }
      }),
  }
}

function normalizeDatasetMetadata(value: unknown): DatasetMetadata {
  const dataset = isRecord(value) ? value : {}

  return {
    id: asString(dataset.id, 'imported-session'),
    name: asString(dataset.name, 'Imported BGSR session'),
    description: asString(dataset.description, ''),
    category:
      dataset.category === 'flora' ||
      dataset.category === 'fauna' ||
      dataset.category === 'biome' ||
      dataset.category === 'soil'
        ? dataset.category
        : 'biome',
    regionLabel: asString(dataset.regionLabel, 'Imported session'),
    featureCount: asNumber(dataset.featureCount),
    updatedAt: asString(dataset.updatedAt, new Date().toISOString()),
    status:
      dataset.status === 'processing' || dataset.status === 'draft'
        ? dataset.status
        : 'ready',
    tags: asStringArray(dataset.tags),
  }
}

function normalizeBaseLayers(value: unknown): Array<LayerMetadata & { isVisible: boolean; opacity: number }> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((layer, index) => ({
    id: asString(layer.id, `imported-layer-${index + 1}`),
    datasetId: asString(layer.datasetId, 'imported-session'),
    name: asString(layer.name, `Imported layer ${index + 1}`),
    description: asString(layer.description, ''),
    geometryType:
      layer.geometryType === 'line' || layer.geometryType === 'circle'
        ? layer.geometryType
        : 'fill',
    color: asString(layer.color, '#4f7d4c'),
    defaultOpacity: asNumber(layer.defaultOpacity, 0.8),
    isVisibleByDefault: asBoolean(layer.isVisibleByDefault, true),
    featureCount: asNumber(layer.featureCount),
    legendLabel: asString(layer.legendLabel, asString(layer.name, `Imported layer ${index + 1}`)),
    isVisible: asBoolean(layer.isVisible, true),
    opacity: asNumber(layer.opacity, 0.8),
  }))
}

function normalizeEnvironmentalLayers(value: unknown): EnvironmentalLayer[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((layer, index) => ({
    id: asString(layer.id, `environmental-layer-${index + 1}`),
    type: 'soilgrids',
    provider: 'ISRIC',
    label: asString(layer.label, `Environmental layer ${index + 1}`),
    description: asString(layer.description),
    propertyId: asString(layer.propertyId),
    propertyLabel: asString(layer.propertyLabel),
    depthId: asString(layer.depthId),
    depthLabel: asString(layer.depthLabel),
    statisticId: asString(layer.statisticId),
    statisticLabel: asString(layer.statisticLabel),
    unit: asString(layer.unit),
    attribution: asString(layer.attribution),
    tileUrlTemplate: asString(layer.tileUrlTemplate),
    legend: {
      url: isRecord(layer.legend) ? asString(layer.legend.url) : '',
    },
    isVisible: asBoolean(layer.isVisible, true),
    opacity: asNumber(layer.opacity, 0.8),
  }))
}

function normalizeConnectorDatasets(value: unknown): ConnectorDataset[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((dataset, index) => ({
    id: asString(dataset.id, `connector-dataset-${index + 1}`),
    color: asString(dataset.color, '#8a5a36'),
    importedAt: asString(dataset.importedAt, new Date().toISOString()),
    isVisible: asBoolean(dataset.isVisible, true),
    label: asString(dataset.label, `Imported dataset ${index + 1}`),
    context: dataset.context === 'bbox' ? 'bbox' : 'manual',
    sourceType:
      dataset.sourceType === 'csv' ||
      dataset.sourceType === 'gbif' ||
      dataset.sourceType === 'shapefile' ||
      dataset.sourceType === 'macrostrat' ||
      dataset.sourceType === 'wosis'
        ? dataset.sourceType
        : 'csv',
    tone:
      dataset.tone === 'moss' ||
      dataset.tone === 'ocean' ||
      dataset.tone === 'plum' ||
      dataset.tone === 'amber' ||
      dataset.tone === 'olive'
        ? dataset.tone
        : 'copper',
    provenance: {
      provider:
        dataset.provenance && isRecord(dataset.provenance) &&
        (dataset.provenance.provider === 'CSV' ||
          dataset.provenance.provider === 'GBIF' ||
          dataset.provenance.provider === 'Macrostrat' ||
          dataset.provenance.provider === 'Shapefile' ||
          dataset.provenance.provider === 'WoSIS')
          ? dataset.provenance.provider
          : 'Unknown',
      sourceName:
        dataset.provenance && isRecord(dataset.provenance)
          ? asString(dataset.provenance.sourceName, asString(dataset.label, `Imported dataset ${index + 1}`))
          : asString(dataset.label, `Imported dataset ${index + 1}`),
      importedAt:
        dataset.provenance && isRecord(dataset.provenance)
          ? asString(dataset.provenance.importedAt, asString(dataset.importedAt, new Date().toISOString()))
          : asString(dataset.importedAt, new Date().toISOString()),
      recordCount:
        dataset.provenance && isRecord(dataset.provenance)
          ? asNumber(dataset.provenance.recordCount)
          : 0,
      queryLabel:
        dataset.provenance && isRecord(dataset.provenance)
          ? asNullableString(dataset.provenance.queryLabel)
          : null,
      queryParams:
        dataset.provenance && isRecord(dataset.provenance)
          ? normalizeQueryParams(dataset.provenance.queryParams)
          : {},
      notes:
        dataset.provenance && isRecord(dataset.provenance)
          ? asStringArray(dataset.provenance.notes)
          : [],
    },
    collection: normalizeFeatureCollection(dataset.collection),
  }))
}

function normalizeRecentQueries(value: unknown): ConnectorQueryHistoryEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((entry, index) => ({
    id: asString(entry.id, `imported-query-${index + 1}`),
    context: entry.context === 'bbox' ? 'bbox' : 'manual',
    recordedAt: asString(entry.recordedAt, new Date().toISOString()),
    sourceType:
      entry.sourceType === 'csv' ||
      entry.sourceType === 'gbif' ||
      entry.sourceType === 'shapefile' ||
      entry.sourceType === 'macrostrat' ||
      entry.sourceType === 'wosis'
        ? entry.sourceType
        : 'csv',
    label: asString(entry.label, `Imported query ${index + 1}`),
    provenance: {
      provider:
        entry.provenance && isRecord(entry.provenance) &&
        (entry.provenance.provider === 'CSV' ||
          entry.provenance.provider === 'GBIF' ||
          entry.provenance.provider === 'Macrostrat' ||
          entry.provenance.provider === 'Shapefile' ||
          entry.provenance.provider === 'WoSIS')
          ? entry.provenance.provider
          : 'Unknown',
      sourceName:
        entry.provenance && isRecord(entry.provenance)
          ? asString(entry.provenance.sourceName, asString(entry.label, `Imported query ${index + 1}`))
          : asString(entry.label, `Imported query ${index + 1}`),
      importedAt:
        entry.provenance && isRecord(entry.provenance)
          ? asString(entry.provenance.importedAt, asString(entry.recordedAt, new Date().toISOString()))
          : asString(entry.recordedAt, new Date().toISOString()),
      recordCount:
        entry.provenance && isRecord(entry.provenance)
          ? asNumber(entry.provenance.recordCount)
          : 0,
      queryLabel:
        entry.provenance && isRecord(entry.provenance)
          ? asNullableString(entry.provenance.queryLabel)
          : null,
      queryParams:
        entry.provenance && isRecord(entry.provenance)
          ? normalizeQueryParams(entry.provenance.queryParams)
          : {},
      notes:
        entry.provenance && isRecord(entry.provenance)
          ? asStringArray(entry.provenance.notes)
          : [],
    },
  }))
}

function normalizeUploadHistory(value: unknown): UploadResult[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((entry, index) => ({
    id: asString(entry.id, `imported-upload-${index + 1}`),
    sourceName: asString(entry.sourceName, `Imported upload ${index + 1}`),
    featureCount: asNumber(entry.featureCount),
    importedAt: asString(entry.importedAt, new Date().toISOString()),
    status: entry.status === 'error' ? 'error' : 'success',
    message: asString(entry.message),
  }))
}

export function parseBgsrSessionFile(
  parsedJson: unknown,
  normalizedVersion = currentBgsrSessionVersion,
): BgsrSessionImport {
  if (!isRecord(parsedJson) || parsedJson.format !== 'bgsr-session') {
    throw new Error('Selected file is not a BGSR session export.')
  }

  const dataset = normalizeDatasetMetadata(parsedJson.dataset)
  const map = isRecord(parsedJson.map) ? parsedJson.map : {}
  const areaQuery = isRecord(parsedJson.areaQuery) ? parsedJson.areaQuery : {}
  const areaQueryFilters = isRecord(areaQuery.gbifFilters) ? areaQuery.gbifFilters : {}
  const layers = isRecord(parsedJson.layers) ? parsedJson.layers : {}
  const sessionData = isRecord(parsedJson.sessionData) ? parsedJson.sessionData : {}

  return {
    application:
      isRecord(parsedJson.application) && parsedJson.application.acronym === 'BGSR'
        ? {
            acronym: 'BGSR',
            name: asString(parsedJson.application.name, 'Biodiversity and Geoscience Session Recorder'),
          }
        : undefined,
    areaQuery: {
      gbifFilters: {
        basisOfRecord: asNullableString(areaQueryFilters.basisOfRecord) ?? '',
        country: asNullableString(areaQueryFilters.country) ?? '',
        includeFauna: asBoolean(areaQueryFilters.includeFauna, true),
        includeFlora: asBoolean(areaQueryFilters.includeFlora, true),
        requireImage: asBoolean(areaQueryFilters.requireImage, false),
        stateProvince: asNullableString(areaQueryFilters.stateProvince) ?? '',
        yearFrom: asString(areaQueryFilters.yearFrom),
        yearTo: asString(areaQueryFilters.yearTo),
      },
      includeGbif: asBoolean(areaQuery.includeGbif, true),
      includeMacrostrat: asBoolean(areaQuery.includeMacrostrat, true),
      isResultsCollapsed: asBoolean(areaQuery.isResultsCollapsed, true),
    },
    dataset,
    exportedAt: asString(parsedJson.exportedAt, new Date().toISOString()),
    format: 'bgsr-session',
    layers: {
      base: normalizeBaseLayers(layers.base),
      environmental: normalizeEnvironmentalLayers(layers.environmental),
    },
    map: {
      activePanel: map.activePanel === 'layers' ? 'layers' : null,
      activeTool: map.activeTool === 'pan' || map.activeTool === 'bbox' ? map.activeTool : 'inspect',
      environmentalProbeCoordinates:
        Array.isArray(map.environmentalProbeCoordinates) &&
        typeof map.environmentalProbeCoordinates[0] === 'number' &&
        typeof map.environmentalProbeCoordinates[1] === 'number'
          ? [map.environmentalProbeCoordinates[0], map.environmentalProbeCoordinates[1]]
          : null,
      hoveredFeatureId: asNullableString(map.hoveredFeatureId),
      selection:
        isRecord(map.selection) &&
        typeof map.selection.featureId === 'string' &&
        typeof map.selection.layerId === 'string' &&
        Array.isArray(map.selection.coordinates) &&
        typeof map.selection.coordinates[0] === 'number' &&
        typeof map.selection.coordinates[1] === 'number'
          ? {
              featureId: map.selection.featureId,
              layerId: map.selection.layerId,
              coordinates: [map.selection.coordinates[0], map.selection.coordinates[1]],
            }
          : null,
      visibleFeatureCount: asNumber(map.visibleFeatureCount),
    },
    sessionData: {
      baseFeatures: normalizeFeatureCollection(sessionData.baseFeatures),
      connectorDatasets: normalizeConnectorDatasets(sessionData.connectorDatasets),
      recentQueries: normalizeRecentQueries(sessionData.recentQueries),
      uploadHistory: normalizeUploadHistory(sessionData.uploadHistory),
    },
    summary: {
      baseFeatureCount: isRecord(parsedJson.summary) ? asNumber(parsedJson.summary.baseFeatureCount) : undefined,
      connectorDatasetCount: isRecord(parsedJson.summary) ? asNumber(parsedJson.summary.connectorDatasetCount) : 0,
      environmentalLayerCount: isRecord(parsedJson.summary) ? asNumber(parsedJson.summary.environmentalLayerCount) : 0,
      uploadHistoryCount: isRecord(parsedJson.summary) ? asNumber(parsedJson.summary.uploadHistoryCount) : 0,
      visibleBaseLayerCount: isRecord(parsedJson.summary) ? asNumber(parsedJson.summary.visibleBaseLayerCount) : undefined,
    },
    version:
      normalizedVersion === currentBgsrSessionVersion ? currentBgsrSessionVersion : 1,
  }
}
