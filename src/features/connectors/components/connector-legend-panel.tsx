import { Card, CardContent, CardHeader, CardTitle } from 'boulder-ui'

import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './connector-legend-panel.css'

interface ConnectorLegendPanelProps {
  datasets: ConnectorDataset[]
  onClearAll: () => void
}

export function ConnectorLegendPanel({
  datasets,
  onClearAll,
}: ConnectorLegendPanelProps) {
  return (
    <Card className="connector-legend-panel" variant="default">
      <CardHeader className="connector-legend-panel__header">
        <CardTitle as="h3">Connected datasets</CardTitle>
        <AppButton onClick={onClearAll} variant="secondary">
          Clear all
        </AppButton>
      </CardHeader>

      <CardContent className="connector-legend-panel__content">
        <ul className="connector-legend-panel__list">
          {datasets.map((dataset) => (
            <li className="connector-legend-panel__item" key={dataset.id}>
              <span
                aria-hidden="true"
                className={`connector-legend-panel__swatch connector-legend-panel__swatch--${dataset.tone}`}
              />
              <div className="connector-legend-panel__copy">
                <strong>{dataset.label}</strong>
                <span>{dataset.sourceType.toUpperCase()}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
