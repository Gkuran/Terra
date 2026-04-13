import type { Feature, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

export interface ConnectorFeatureFilters {
  includeCategories?: FeatureProperties['category'][]
  requireImage?: boolean
  basisOfRecord?: string | null
  country?: string | null
  stateProvince?: string | null
  yearFrom?: string
  yearTo?: string
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

export function filterConnectorFeatures(
  features: Array<Feature<Geometry, FeatureProperties>>,
  filters: ConnectorFeatureFilters,
) {
  return features.filter((feature) => {
    const category = feature.properties.category
    const rawAttributes = feature.properties.rawAttributes ?? {}
    const basisOfRecord = rawAttributes.basisOfRecord?.trim() ?? ''
    const country = rawAttributes.country?.trim() ?? ''
    const stateProvince = rawAttributes.stateProvince?.trim() ?? ''
    const hasMedia = rawAttributes.hasMedia === 'true'

    if (
      filters.includeCategories &&
      filters.includeCategories.length > 0 &&
      !filters.includeCategories.includes(category)
    ) {
      return false
    }

    if (filters.requireImage && !hasMedia) {
      return false
    }

    if (filters.basisOfRecord && basisOfRecord !== filters.basisOfRecord) {
      return false
    }

    if (filters.country && country !== filters.country) {
      return false
    }

    if (filters.stateProvince && stateProvince !== filters.stateProvince) {
      return false
    }

    if (
      !matchesYearRange(
        feature.properties.observedAt,
        filters.yearFrom ?? '',
        filters.yearTo ?? '',
      )
    ) {
      return false
    }

    return true
  })
}

export function filterConnectorDatasetFeatures(
  dataset: ConnectorDataset,
  filters: ConnectorFeatureFilters,
) {
  return filterConnectorFeatures(dataset.collection.features, filters)
}

export function parseConnectorObservedYear(observedAt: string) {
  return parseObservedYear(observedAt)
}
