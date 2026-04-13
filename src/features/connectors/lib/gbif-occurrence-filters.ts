import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { filterConnectorDatasetFeatures } from '@/features/connectors/lib/filter-connector-features'
import { summarizeConnectorFeatures } from '@/features/connectors/lib/summarize-connector-dataset'

export interface GbifOccurrenceFilters {
  includeFlora: boolean
  includeFauna: boolean
  requireImage: boolean
  basisOfRecord: string | null
  country: string | null
  stateProvince: string | null
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
  country: null,
  stateProvince: null,
  yearFrom: '',
  yearTo: '',
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
          features: filterConnectorDatasetFeatures(dataset, {
            includeCategories: [
              ...(filters.includeFlora ? ['flora' as const] : []),
              ...(filters.includeFauna ? ['fauna' as const] : []),
            ],
            requireImage: filters.requireImage,
            basisOfRecord: filters.basisOfRecord,
            country: filters.country,
            stateProvince: filters.stateProvince,
            yearFrom: filters.yearFrom,
            yearTo: filters.yearTo,
          }),
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
  const filteredSummary = summarizeConnectorFeatures(filteredFeatures)

  return {
    totalRecords: totalFeatures.length,
    filteredRecords: filteredSummary.totalRecords,
    floraCount: filteredSummary.floraCount,
    faunaCount: filteredSummary.faunaCount,
    imageCount: filteredSummary.imageCount,
    basisOfRecordCounts: filteredSummary.basisOfRecordCounts,
    topSpecies: filteredSummary.topSpecies,
    yearRange: filteredSummary.yearRange,
  }
}
