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
                <span
                  aria-hidden="true"
                  className={`connector-legend-panel__swatch connector-legend-panel__swatch--${dataset.tone}`}
                />
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
