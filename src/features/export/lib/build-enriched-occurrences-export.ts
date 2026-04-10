import type { Feature, Geometry, Point, Polygon, MultiPolygon, Position } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { SoilGridsPointSample } from '@/features/environmental-layers/types/environmental-layer'

interface ExportPointSampleItem {
  id: string
  samples: SoilGridsPointSample[]
}

interface BuildEnrichedOccurrencesExportInput {
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

  const headers = Object.keys(rows[0])
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
  gbifDatasets,
  macrostratDatasets,
  soilSampleItems,
}: BuildEnrichedOccurrencesExportInput) {
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
    const macrostratFeature = pointCoordinates
      ? findMacrostratFeatureForPoint(
          [pointCoordinates.longitude, pointCoordinates.latitude],
          macrostratFeatures,
        )
      : null
    const soilSamples = soilSampleById.get(feature.properties.id) ?? []
    const soilColumns = Object.fromEntries(
      soilSamples.map((sample) => [
        normalizeSoilColumnName(sample),
        sample.value === null ? '' : `${sample.value} ${sample.unit}`,
      ]),
    )

    return {
      occurrence_key: occurrenceKey,
      dataset_label: datasetLabel,
      category: feature.properties.category,
      scientific_name: feature.properties.scientificName ?? feature.properties.title,
      observed_at: feature.properties.observedAt,
      latitude: pointCoordinates ? `${pointCoordinates.latitude}` : '',
      longitude: pointCoordinates ? `${pointCoordinates.longitude}` : '',
      basis_of_record: rawAttributes.basisOfRecord ?? '',
      country: rawAttributes.country ?? feature.properties.biome,
      municipality: feature.properties.municipality,
      macrostrat_unit: macrostratFeature?.properties.title ?? '',
      macrostrat_lithology:
        macrostratFeature?.properties.rawAttributes?.lithology ??
        macrostratFeature?.properties.municipality ??
        '',
      macrostrat_interval:
        macrostratFeature?.properties.rawAttributes?.bestInterval ??
        macrostratFeature?.properties.biome ??
        '',
      macrostrat_reference:
        macrostratFeature?.properties.rawAttributes?.sourceReference ?? '',
      ...soilColumns,
    }
  })

  return {
    csv: toCsv(rows),
    rowCount: rows.length,
  }
}
