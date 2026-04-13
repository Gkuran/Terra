import type { Feature, Geometry, Point, Polygon, MultiPolygon, Position } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { SoilGridsPointSample } from '@/features/environmental-layers/types/environmental-layer'

interface ExportPointSampleItem {
  id: string
  samples: SoilGridsPointSample[]
}

interface ExportEnvironmentalLayerSnapshot {
  depthId: string
  id: string
  isVisible: string
  label: string
  opacity: string
  propertyId: string
  statisticId: string
}

interface BuildEnrichedOccurrencesExportInput {
  activeEnvironmentalLayers: ExportEnvironmentalLayerSnapshot[]
  activeFilters: Record<string, string | boolean | null>
  gbifDatasets: ConnectorDataset[]
  macrostratDatasets: ConnectorDataset[]
  soilSampleItems: ExportPointSampleItem[]
}

function escapeCsvCell(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function toCsv(rows: Array<Record<string, string>>) {
  if (rows.length === 0) {
    return ''
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const headerRow = headers.map(escapeCsvCell).join(',')
  const bodyRows = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header] ?? '')).join(','),
  )

  return [headerRow, ...bodyRows].join('\n')
}

function normalizeSoilColumnName(sample: SoilGridsPointSample) {
  const property = sample.propertyId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  const depth = sample.depthId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  const statistic = sample.statisticId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()

  return `soil_${property}_${depth}_${statistic}`
}

function extractPointCoordinates(feature: Feature<Geometry, FeatureProperties>) {
  if (feature.geometry.type !== 'Point') {
    return null
  }

  const [longitude, latitude] = feature.geometry.coordinates
  return { longitude, latitude }
}

function isRingContainingPoint(ring: Position[], point: [number, number]) {
  let isInside = false

  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index++) {
    const [xi, yi] = ring[index]
    const [xj, yj] = ring[previousIndex]
    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || Number.EPSILON) + xi

    if (intersects) {
      isInside = !isInside
    }
  }

  return isInside
}

function polygonContainsPoint(polygon: Polygon['coordinates'], point: [number, number]) {
  if (!polygon[0] || !isRingContainingPoint(polygon[0], point)) {
    return false
  }

  for (const hole of polygon.slice(1)) {
    if (isRingContainingPoint(hole, point)) {
      return false
    }
  }

  return true
}

function geometryContainsPoint(
  geometry: Polygon | MultiPolygon,
  point: [number, number],
) {
  if (geometry.type === 'Polygon') {
    return polygonContainsPoint(geometry.coordinates, point)
  }

  return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, point))
}

function findMacrostratFeatureForPoint(
  point: [number, number],
  macrostratFeatures: Array<Feature<Geometry, FeatureProperties>>,
) {
  return (
    macrostratFeatures.find((feature) => {
      if (
        feature.geometry.type !== 'Polygon' &&
        feature.geometry.type !== 'MultiPolygon'
      ) {
        return false
      }

      return geometryContainsPoint(feature.geometry, point)
    }) ?? null
  )
}

export function buildEnrichedOccurrencesExport({
  activeEnvironmentalLayers,
  activeFilters,
  gbifDatasets,
  macrostratDatasets,
  soilSampleItems,
}: BuildEnrichedOccurrencesExportInput) {
  const exportedAt = new Date().toISOString()
  const gbifFeatures = gbifDatasets.flatMap((dataset) =>
    dataset.collection.features
      .filter(
        (feature): feature is Feature<Point, FeatureProperties> =>
          feature.geometry.type === 'Point',
      )
      .map((feature) => ({
        datasetLabel: dataset.label,
        feature,
      })),
  )
  const macrostratFeatures = macrostratDatasets.flatMap(
    (dataset) => dataset.collection.features,
  )
  const soilSampleById = new Map(
    soilSampleItems.map((item) => [item.id, item.samples]),
  )

  const rows = gbifFeatures.map(({ datasetLabel, feature }) => {
    const pointCoordinates = extractPointCoordinates(feature)
    const rawAttributes = feature.properties.rawAttributes ?? {}
    const occurrenceKey = rawAttributes.occurrenceKey ?? ''
    const sourceDataset =
      gbifDatasets.find((dataset) => dataset.id === feature.properties.datasetId) ?? null
    const macrostratFeature = pointCoordinates
      ? findMacrostratFeatureForPoint(
          [pointCoordinates.longitude, pointCoordinates.latitude],
          macrostratFeatures,
        )
      : null
    const soilSamples = soilSampleById.get(feature.properties.id) ?? []
    const soilColumns = Object.fromEntries(
      soilSamples.flatMap((sample) => {
        const baseColumnName = normalizeSoilColumnName(sample)

        return [
          [baseColumnName, sample.value === null ? '' : `${sample.value}`],
          [`${baseColumnName}_unit`, sample.unit],
          [`${baseColumnName}_label`, sample.propertyLabel],
        ] as const
      }),
    )

    return {
      bgsr_export_format: 'bgsr-enriched-occurrences-csv',
      bgsr_exported_at: exportedAt,
      bgsr_dataset_id: sourceDataset?.id ?? feature.properties.datasetId,
      occurrence_key: occurrenceKey,
      dataset_label: datasetLabel,
      dataset_source_type: sourceDataset?.sourceType ?? 'gbif',
      dataset_context: sourceDataset?.context ?? '',
      dataset_provider: sourceDataset?.provenance.provider ?? 'GBIF',
      dataset_imported_at: sourceDataset?.importedAt ?? '',
      dataset_query_label: sourceDataset?.provenance.queryLabel ?? '',
      dataset_query_params_json: JSON.stringify(sourceDataset?.provenance.queryParams ?? {}),
      dataset_notes_json: JSON.stringify(sourceDataset?.provenance.notes ?? []),
      session_filters_json: JSON.stringify(activeFilters),
      environmental_layers_json: JSON.stringify(activeEnvironmentalLayers),
      feature_id: feature.properties.id,
      category: feature.properties.category,
      scientific_name: feature.properties.scientificName ?? feature.properties.title,
      common_name: rawAttributes.vernacularName ?? '',
      observed_at: feature.properties.observedAt,
      latitude: pointCoordinates ? `${pointCoordinates.latitude}` : '',
      longitude: pointCoordinates ? `${pointCoordinates.longitude}` : '',
      basis_of_record: rawAttributes.basisOfRecord ?? '',
      country: rawAttributes.country ?? feature.properties.biome,
      state_province: rawAttributes.stateProvince ?? '',
      municipality: feature.properties.municipality,
      biome: feature.properties.biome,
      summary: feature.properties.summary,
      recorded_by: rawAttributes.recordedBy ?? '',
      institution_code: rawAttributes.institutionCode ?? '',
      kingdom: rawAttributes.kingdom ?? '',
      has_media: rawAttributes.hasMedia ?? '',
      media_count: rawAttributes.mediaCount ?? '',
      macrostrat_unit: macrostratFeature?.properties.title ?? '',
      macrostrat_dataset_label:
        macrostratFeature?.properties.datasetId
          ? macrostratDatasets.find((dataset) => dataset.id === macrostratFeature.properties.datasetId)?.label ?? ''
          : '',
      macrostrat_lithology:
        macrostratFeature?.properties.rawAttributes?.lithology ??
        macrostratFeature?.properties.municipality ??
        '',
      macrostrat_interval:
        macrostratFeature?.properties.rawAttributes?.bestInterval ??
        macrostratFeature?.properties.biome ??
        '',
      macrostrat_top_interval:
        macrostratFeature?.properties.rawAttributes?.topInterval ?? '',
      macrostrat_bottom_interval:
        macrostratFeature?.properties.rawAttributes?.bottomInterval ?? '',
      macrostrat_top_age_ma:
        macrostratFeature?.properties.rawAttributes?.topAgeMa ?? '',
      macrostrat_bottom_age_ma:
        macrostratFeature?.properties.rawAttributes?.bottomAgeMa ?? '',
      macrostrat_reference:
        macrostratFeature?.properties.rawAttributes?.sourceReference ?? '',
      macrostrat_description:
        macrostratFeature?.properties.rawAttributes?.description ?? '',
      ...soilColumns,
    }
  })

  return {
    csv: toCsv(rows),
    rowCount: rows.length,
  }
}
