import { Card, CardContent, CardHeader, CardTitle, DataAttribute } from 'boulder-ui'

import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'

import './environmental-context-panel.css'

interface EnvironmentalContextPanelProps {
  layers: EnvironmentalLayer[]
}

function buildVisibleLayerSummary(layer: EnvironmentalLayer) {
  return `${layer.propertyLabel} at ${layer.depthLabel}`
}

export function EnvironmentalContextPanel({
  layers,
}: EnvironmentalContextPanelProps) {
  if (layers.length === 0) {
    return null
  }

  const visibleLayers = layers.filter((layer) => layer.isVisible)

  return (
    <Card className="environmental-context-panel" variant="default">
      <CardHeader>
        <CardTitle as="h3">Environmental context</CardTitle>
      </CardHeader>

      <CardContent className="environmental-context-panel__content">
        <p className="environmental-context-panel__summary">
          Soil surfaces currently visible in the workspace. These layers describe
          environmental context for the same region shown with fauna, flora, and
          geologic observations.
        </p>

        <div className="environmental-context-panel__grid">
          <DataAttribute
            label="Active layers"
            orientation="vertical"
            value={`${layers.length}`}
          />
          <DataAttribute
            label="Visible layers"
            orientation="vertical"
            value={`${visibleLayers.length}`}
          />
        </div>

        <ul className="environmental-context-panel__list">
          {layers.map((layer) => (
            <li className="environmental-context-panel__item" key={layer.id}>
              <strong>{buildVisibleLayerSummary(layer)}</strong>
              <span>
                {layer.statisticLabel} · {layer.unit}
              </span>
              <span>{layer.isVisible ? 'Visible on map' : 'Hidden'}</span>
              <span>{layer.attribution}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
