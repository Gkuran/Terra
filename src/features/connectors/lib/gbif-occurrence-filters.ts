import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

export interface GbifOccurrenceFilters {
  includeFlora: boolean
  includeFauna: boolean
  requireImage: boolean
  basisOfRecord: string | null
  yearFrom: string
  yearTo: string
}

export interface GbifOccurrenceSummary {
  totalRecords: number
  filteredRecords: number
  floraCount: number
  faunaCount: number
  imageCount: number
  basisOfRecordCounts: Array<{ label: string; count: number }>
  topSpecies: Array<{ scientificName: string; kingdom: string; count: number }>
  yearRange: { min: number | null; max: number | null }
}

export const defaultGbifOccurrenceFilters: GbifOccurrenceFilters = {
  includeFlora: true,
  includeFauna: true,
  requireImage: false,
  basisOfRecord: null,
  yearFrom: '',
  yearTo: '',
}

function parseObservedYear(observedAt: string) {
  const match = observedAt.match(/^(\d{4})/)

  if (!match) {
    return null
  }

  return Number(match[1])
}

function matchesYearRange(
  observedAt: string,
  yearFrom: string,
  yearTo: string,
) {
  const observedYear = parseObservedYear(observedAt)
  const from = yearFrom.trim() === '' ? null : Number(yearFrom)
  const to = yearTo.trim() === '' ? null : Number(yearTo)

  if (observedYear === null) {
    return from === null && to === null
  }

  if (from !== null && observedYear < from) {
    return false
  }

  if (to !== null && observedYear > to) {
    return false
  }

  return true
}

function filterGbifDatasetFeatures(
  dataset: ConnectorDataset,
  filters: GbifOccurrenceFilters,
) {
  return dataset.collection.features.filter((feature) => {
    const category = feature.properties.category
    const rawAttributes = feature.properties.rawAttributes ?? {}
    const basisOfRecord = rawAttributes.basisOfRecord?.trim() ?? ''
    const hasMedia = rawAttributes.hasMedia === 'true'

    if (category === 'flora' && !filters.includeFlora) {
      return false
    }

    if (category === 'fauna' && !filters.includeFauna) {
      return false
    }

    if (filters.requireImage && !hasMedia) {
      return false
    }

    if (filters.basisOfRecord && basisOfRecord !== filters.basisOfRecord) {
      return false
    }

    if (!matchesYearRange(feature.properties.observedAt, filters.yearFrom, filters.yearTo)) {
      return false
    }

    return true
  })
}

export function filterConnectorDatasetsByGbifFilters(
  datasets: ConnectorDataset[],
  filters: GbifOccurrenceFilters,
) {
  return datasets
    .map((dataset) => {
      if (dataset.sourceType !== 'gbif') {
        return dataset
      }

      return {
        ...dataset,
        collection: {
          ...dataset.collection,
          features: filterGbifDatasetFeatures(dataset, filters),
        },
      }
    })
    .filter(
      (dataset) => dataset.sourceType !== 'gbif' || dataset.collection.features.length > 0,
    )
}

export function buildGbifOccurrenceSummary(
  datasets: ConnectorDataset[],
  filters: GbifOccurrenceFilters,
): GbifOccurrenceSummary {
  const gbifDatasets = datasets.filter((dataset) => dataset.sourceType === 'gbif')
  const totalFeatures = gbifDatasets.flatMap((dataset) => dataset.collection.features)
  const filteredFeatures = filterConnectorDatasetsByGbifFilters(gbifDatasets, filters).flatMap(
    (dataset) => dataset.collection.features,
  )

  const basisCounts = new Map<string, number>()
  const speciesCounts = new Map<string, { count: number; kingdom: string }>()
  const observedYears: number[] = []

  for (const feature of filteredFeatures) {
    const rawAttributes = feature.properties.rawAttributes ?? {}
    const basisOfRecord = rawAttributes.basisOfRecord?.trim() || 'Not provided'
    const scientificName =
      feature.properties.scientificName?.trim() || feature.properties.title.trim()
    const kingdom = rawAttributes.kingdom?.trim() || 'Unclassified'
    const observedYear = parseObservedYear(feature.properties.observedAt)

    basisCounts.set(basisOfRecord, (basisCounts.get(basisOfRecord) ?? 0) + 1)

    const currentSpecies = speciesCounts.get(scientificName)
    speciesCounts.set(scientificName, {
      count: (currentSpecies?.count ?? 0) + 1,
      kingdom,
    })

    if (observedYear !== null) {
      observedYears.push(observedYear)
    }
  }

  return {
    totalRecords: totalFeatures.length,
    filteredRecords: filteredFeatures.length,
    floraCount: filteredFeatures.filter((feature) => feature.properties.category === 'flora')
      .length,
    faunaCount: filteredFeatures.filter((feature) => feature.properties.category === 'fauna')
      .length,
    imageCount: filteredFeatures.filter(
      (feature) => feature.properties.rawAttributes?.hasMedia === 'true',
    ).length,
    basisOfRecordCounts: [...basisCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count),
    topSpecies: [...speciesCounts.entries()]
      .map(([scientificName, entry]) => ({
        scientificName,
        kingdom: entry.kingdom,
        count: entry.count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    yearRange: {
      min: observedYears.length > 0 ? Math.min(...observedYears) : null,
      max: observedYears.length > 0 ? Math.max(...observedYears) : null,
    },
  }
}
