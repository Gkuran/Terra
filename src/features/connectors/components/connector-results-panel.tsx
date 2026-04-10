import { Card, CardContent, CardHeader, CardTitle, Tag } from 'boulder-ui'
import { LuChevronDown, LuChevronUp } from 'react-icons/lu'

import type {
  GbifOccurrenceFilters,
  GbifOccurrenceSummary,
} from '@/features/connectors/lib/gbif-occurrence-filters'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './connector-results-panel.css'

interface ConnectorResultsPanelProps {
  datasets: ConnectorDataset[]
  filters: GbifOccurrenceFilters
  availableBasisOfRecord: string[]
  summary: GbifOccurrenceSummary
  isCollapsed: boolean
  onFiltersChange: (nextFilters: GbifOccurrenceFilters) => void
  onToggleCollapse: () => void
}

function buildDatasetTopSpecies(dataset: ConnectorDataset) {
  const groupedBySpecies = new Map<string, { count: number; kingdom: string }>()

  for (const feature of dataset.collection.features) {
    const scientificName =
      feature.properties.scientificName?.trim() || feature.properties.title.trim()
    const kingdom = feature.properties.rawAttributes?.kingdom || 'Unclassified'
    const currentEntry = groupedBySpecies.get(scientificName)

    groupedBySpecies.set(scientificName, {
      count: (currentEntry?.count ?? 0) + 1,
      kingdom,
    })
  }

  return [...groupedBySpecies.entries()]
    .map(([scientificName, entry]) => ({
      scientificName,
      kingdom: entry.kingdom,
      count: entry.count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
}

export function ConnectorResultsPanel({
  datasets,
  filters,
  availableBasisOfRecord,
  summary,
  isCollapsed,
  onFiltersChange,
  onToggleCollapse,
}: ConnectorResultsPanelProps) {
  const hasActiveFilters =
    !filters.includeFlora ||
    !filters.includeFauna ||
    filters.requireImage ||
    filters.basisOfRecord !== null ||
    filters.yearFrom.trim() !== '' ||
    filters.yearTo.trim() !== ''

  return (
    <Card className="connector-results-panel" variant="default">
      <CardHeader className="connector-results-panel__header">
        <CardTitle as="h3">Area query results</CardTitle>
        <AppButton
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand area query results' : 'Collapse area query results'}
          className="connector-results-panel__collapse-button"
          onClick={onToggleCollapse}
          variant="secondary"
        >
          {isCollapsed ? <LuChevronDown aria-hidden="true" /> : <LuChevronUp aria-hidden="true" />}
        </AppButton>
      </CardHeader>

      <CardContent
        className={`connector-results-panel__content${isCollapsed ? ' connector-results-panel__content--collapsed' : ''}`}
      >
        <section className="connector-results-panel__summary">
          <div className="connector-results-panel__summary-header">
            <strong>Observation summary</strong>
            {hasActiveFilters ? (
              <AppButton
                onClick={() =>
                  onFiltersChange({
                    includeFlora: true,
                    includeFauna: true,
                    requireImage: false,
                    basisOfRecord: null,
                    yearFrom: '',
                    yearTo: '',
                  })
                }
                variant="secondary"
              >
                Reset filters
              </AppButton>
            ) : null}
          </div>

          <div className="connector-results-panel__metrics">
            <Tag variant="primary">Visible: {summary.filteredRecords}</Tag>
            <Tag variant="primary">Flora: {summary.floraCount}</Tag>
            <Tag variant="primary">Fauna: {summary.faunaCount}</Tag>
            <Tag variant="primary">With image: {summary.imageCount}</Tag>
            {summary.totalRecords !== summary.filteredRecords ? (
              <Tag variant="primary">Total loaded: {summary.totalRecords}</Tag>
            ) : null}
          </div>

          <div className="connector-results-panel__filters">
            <div className="connector-results-panel__toggle-group">
              <AppButton
                className={`connector-results-panel__filter-button${filters.includeFlora ? ' connector-results-panel__filter-button--active' : ''}`}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    includeFlora: !filters.includeFlora,
                  })
                }
                variant="secondary"
              >
                Flora
              </AppButton>
              <AppButton
                className={`connector-results-panel__filter-button${filters.includeFauna ? ' connector-results-panel__filter-button--active' : ''}`}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    includeFauna: !filters.includeFauna,
                  })
                }
                variant="secondary"
              >
                Fauna
              </AppButton>
              <AppButton
                className={`connector-results-panel__filter-button${filters.requireImage ? ' connector-results-panel__filter-button--active' : ''}`}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    requireImage: !filters.requireImage,
                  })
                }
                variant="secondary"
              >
                With image
              </AppButton>
            </div>

            <div className="connector-results-panel__field-row">
              <label className="connector-results-panel__field">
                <span>Basis of record</span>
                <select
                  className="connector-results-panel__select"
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      basisOfRecord:
                        event.target.value.trim() === '' ? null : event.target.value,
                    })
                  }
                  value={filters.basisOfRecord ?? ''}
                >
                  <option value="">All records</option>
                  {availableBasisOfRecord.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="connector-results-panel__field">
                <span>Year from</span>
                <input
                  className="connector-results-panel__input"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      yearFrom: event.target.value.replace(/[^\d]/g, '').slice(0, 4),
                    })
                  }
                  placeholder="Any"
                  value={filters.yearFrom}
                />
              </label>

              <label className="connector-results-panel__field">
                <span>Year to</span>
                <input
                  className="connector-results-panel__input"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      yearTo: event.target.value.replace(/[^\d]/g, '').slice(0, 4),
                    })
                  }
                  placeholder="Any"
                  value={filters.yearTo}
                />
              </label>
            </div>
          </div>

          <div className="connector-results-panel__metric-columns">
            <div className="connector-results-panel__metric-block">
              <strong>Top basis of record</strong>
              <ul className="connector-results-panel__simple-list">
                {summary.basisOfRecordCounts.slice(0, 4).map((entry) => (
                  <li key={entry.label}>
                    <span>{entry.label}</span>
                    <span>{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="connector-results-panel__metric-block">
              <strong>Observed years</strong>
              <p className="connector-results-panel__range">
                {summary.yearRange.min !== null && summary.yearRange.max !== null
                  ? `${summary.yearRange.min} to ${summary.yearRange.max}`
                  : 'Not available'}
              </p>
            </div>
          </div>
        </section>

        {datasets.map((dataset) => {
          const topSpecies = buildDatasetTopSpecies(dataset)
          const floraCount = dataset.collection.features.filter(
            (feature) => feature.properties.rawAttributes?.kingdom === 'Plantae',
          ).length
          const faunaCount = dataset.collection.features.filter(
            (feature) => feature.properties.rawAttributes?.kingdom === 'Animalia',
          ).length

          return (
            <section className="connector-results-panel__dataset" key={dataset.id}>
              <div className="connector-results-panel__dataset-header">
                <strong>{dataset.label}</strong>
                <span>{dataset.collection.features.length} records</span>
              </div>

              <div className="connector-results-panel__metrics">
                <Tag variant="primary">
                  Species: {
                    new Set(
                      dataset.collection.features.map(
                        (feature) =>
                          feature.properties.scientificName?.trim() ||
                          feature.properties.title.trim(),
                      ),
                    ).size
                  }
                </Tag>
                <Tag variant="primary">Flora: {floraCount}</Tag>
                <Tag variant="primary">Fauna: {faunaCount}</Tag>
              </div>

              <ul className="connector-results-panel__species-list">
                {topSpecies.map((entry) => (
                  <li className="connector-results-panel__species-item" key={`${dataset.id}-${entry.scientificName}`}>
                    <div>
                      <strong>{entry.scientificName}</strong>
                      <span>{entry.kingdom}</span>
                    </div>
                    <span>{entry.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
