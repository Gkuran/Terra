import { Card, CardContent, CardHeader, CardTitle, Tag } from 'boulder-ui'

import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

import './connector-results-panel.css'

interface ConnectorResultsPanelProps {
  datasets: ConnectorDataset[]
}

function buildGroupedSpeciesSummary(dataset: ConnectorDataset) {
  const groupedBySpecies = new Map<
    string,
    { count: number; kingdom: string }
  >()

  for (const feature of dataset.collection.features) {
    const scientificName =
      feature.properties.scientificName?.trim() ||
      feature.properties.title.trim()
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
}

export function ConnectorResultsPanel({
  datasets,
}: ConnectorResultsPanelProps) {
  return (
    <Card className="connector-results-panel" variant="default">
      <CardHeader className="connector-results-panel__header">
        <CardTitle as="h3">Area query results</CardTitle>
      </CardHeader>

      <CardContent className="connector-results-panel__content">
        {datasets.map((dataset) => {
          const groupedSpecies = buildGroupedSpeciesSummary(dataset)
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
                <Tag variant="primary">Species: {groupedSpecies.length}</Tag>
                <Tag variant="primary">Flora: {floraCount}</Tag>
                <Tag variant="primary">Fauna: {faunaCount}</Tag>
              </div>

              <ul className="connector-results-panel__species-list">
                {groupedSpecies.slice(0, 6).map((entry) => (
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
