import { Card, CardContent, CardHeader, CardTitle, Switch } from 'boulder-ui'
import { LuLocateFixed, LuTrash2 } from 'react-icons/lu'

import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './connector-legend-panel.css'

interface ConnectorLegendPanelProps {
  datasets: ConnectorDataset[]
  onClearAll: () => void
  onRemoveDataset: (datasetId: string) => void
  onSetDatasetVisibility: (datasetId: string, isVisible: boolean) => void
  onZoomToDataset: (datasetId: string) => void
}

function FloraLegendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <path d="M14 25c-1 0-1.8-.8-1.8-1.8v-4.3c0-2.9 1.4-5.4 3.6-7-4.7.4-8.4-1.8-10.7-6.4C8.4 2.8 12 2 15.6 3c2.4.7 4.2 2.3 5.2 4.7 2.5-2 5.1-2.2 7.8-.4-1.1 6.1-4.7 9.4-10.5 9.8-2.6.2-4 1.6-4 4v2.1c0 1-.8 1.8-1.8 1.8Z" fill="#4f7d4c" />
      <path d="M14 20.5c-.3 0-.6-.1-.8-.3a1.2 1.2 0 0 1-.1-1.7l6.9-7.8c.4-.5 1.2-.5 1.7-.1s.5 1.2.1 1.7L14.9 20a1.2 1.2 0 0 1-.9.5Z" fill="#eff7e9" />
    </svg>
  )
}

function FaunaLegendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <circle cx="8.1" cy="8.3" r="3.2" fill="#8a5a36" />
      <circle cx="19.9" cy="8.3" r="3.2" fill="#8a5a36" />
      <circle cx="5.4" cy="14.2" r="2.6" fill="#8a5a36" />
      <circle cx="22.6" cy="14.2" r="2.6" fill="#8a5a36" />
      <path d="M14 23.4c4.1 0 7.3-2.6 7.3-5.9 0-3.7-3.2-6.8-7.3-6.8s-7.3 3.1-7.3 6.8c0 3.3 3.2 5.9 7.3 5.9Z" fill="#8a5a36" />
      <path d="M11.3 17.8c0 1.2 1.2 2.1 2.7 2.1s2.7-.9 2.7-2.1" fill="none" stroke="#fff7e7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function buildLegendMarker(dataset: ConnectorDataset) {
  if (dataset.sourceType !== 'gbif') {
    return (
      <span
        aria-hidden="true"
        className={`connector-legend-panel__swatch connector-legend-panel__swatch--${dataset.tone}`}
      />
    )
  }

  return (
    <div className="connector-legend-panel__gbif-icons" aria-hidden="true">
      <span className="connector-legend-panel__gbif-icon connector-legend-panel__gbif-icon--flora">
        <FloraLegendIcon />
      </span>
      <span className="connector-legend-panel__gbif-icon connector-legend-panel__gbif-icon--fauna">
        <FaunaLegendIcon />
      </span>
    </div>
  )
}

export function ConnectorLegendPanel({
  datasets,
  onClearAll,
  onRemoveDataset,
  onSetDatasetVisibility,
  onZoomToDataset,
}: ConnectorLegendPanelProps) {
  return (
    <Card className="connector-legend-panel" variant="default">
      <CardHeader className="connector-legend-panel__header">
        <CardTitle as="h3">Observation layers</CardTitle>
        <AppButton onClick={onClearAll} variant="secondary">
          Clear all
        </AppButton>
      </CardHeader>

      <CardContent className="connector-legend-panel__content">
        <ul className="connector-legend-panel__list">
          {datasets.map((dataset) => (
            <li className="connector-legend-panel__item" key={dataset.id}>
              <div className="connector-legend-panel__item-main">
                {buildLegendMarker(dataset)}
                <div className="connector-legend-panel__copy">
                  <strong>{dataset.label}</strong>
                  <span>{dataset.collection.features.length} records</span>
                </div>
              </div>

              <div className="connector-legend-panel__actions">
                <Switch
                  checked={dataset.isVisible}
                  id={`dataset-visibility-${dataset.id}`}
                  label=""
                  onChange={(event) =>
                    onSetDatasetVisibility(dataset.id, event.target.checked)
                  }
                />
                <AppButton
                  aria-label={`Zoom to ${dataset.label}`}
                  className="connector-legend-panel__icon-button"
                  onClick={() => onZoomToDataset(dataset.id)}
                  title="Zoom to dataset"
                  variant="secondary"
                >
                  <LuLocateFixed aria-hidden="true" />
                </AppButton>
                <AppButton
                  aria-label={`Remove ${dataset.label}`}
                  className="connector-legend-panel__icon-button"
                  onClick={() => onRemoveDataset(dataset.id)}
                  title="Remove dataset"
                  variant="secondary"
                >
                  <LuTrash2 aria-hidden="true" />
                </AppButton>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
