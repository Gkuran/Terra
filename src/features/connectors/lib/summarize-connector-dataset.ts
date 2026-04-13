import type { Feature, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { parseConnectorObservedYear } from '@/features/connectors/lib/filter-connector-features'

export interface ConnectorDatasetSpeciesSummaryEntry {
  scientificName: string
  kingdom: string
  count: number
}

export interface ConnectorDatasetSummary {
  totalRecords: number
  floraCount: number
  faunaCount: number
  imageCount: number
  speciesCount: number
  topSpecies: ConnectorDatasetSpeciesSummaryEntry[]
  basisOfRecordCounts: Array<{ label: string; count: number }>
  yearRange: { min: number | null; max: number | null }
}

function getFeatureScientificName(feature: Feature<Geometry, FeatureProperties>) {
  return feature.properties.scientificName?.trim() || feature.properties.title.trim()
}

export function summarizeConnectorFeatures(
  features: Array<Feature<Geometry, FeatureProperties>>,
): ConnectorDatasetSummary {
  const basisCounts = new Map<string, number>()
  const speciesCounts = new Map<string, { count: number; kingdom: string }>()
  const observedYears: number[] = []

  for (const feature of features) {
    const rawAttributes = feature.properties.rawAttributes ?? {}
    const basisOfRecord = rawAttributes.basisOfRecord?.trim() || 'Not provided'
    const scientificName = getFeatureScientificName(feature)
    const kingdom = rawAttributes.kingdom?.trim() || 'Unclassified'
    const observedYear = parseConnectorObservedYear(feature.properties.observedAt)

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
    totalRecords: features.length,
    floraCount: features.filter((feature) => feature.properties.category === 'flora').length,
    faunaCount: features.filter((feature) => feature.properties.category === 'fauna').length,
    imageCount: features.filter(
      (feature) => feature.properties.rawAttributes?.hasMedia === 'true',
    ).length,
    speciesCount: speciesCounts.size,
    topSpecies: [...speciesCounts.entries()]
      .map(([scientificName, entry]) => ({
        scientificName,
        kingdom: entry.kingdom,
        count: entry.count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    basisOfRecordCounts: [...basisCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count),
    yearRange: {
      min: observedYears.length > 0 ? Math.min(...observedYears) : null,
      max: observedYears.length > 0 ? Math.max(...observedYears) : null,
    },
  }
}

export function summarizeConnectorDataset(dataset: ConnectorDataset) {
  return summarizeConnectorFeatures(dataset.collection.features)
}
