import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Slider,
  Switch,
} from 'boulder-ui'
import { LuTrash2 } from 'react-icons/lu'

import { SoilGridsLegendBar } from '@/features/environmental-layers/components/soilgrids-legend-bar'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './environmental-layers-panel.css'

interface EnvironmentalLayersPanelProps {
  layers: EnvironmentalLayer[]
  onRemoveLayer: (layerId: string) => void
  onSetLayerOpacity: (layerId: string, opacity: number) => void
  onSetLayerVisibility: (layerId: string, isVisible: boolean) => void
}

export function EnvironmentalLayersPanel({
  layers,
  onRemoveLayer,
  onSetLayerOpacity,
  onSetLayerVisibility,
}: EnvironmentalLayersPanelProps) {
  return (
    <Card
      className="environmental-layers-panel"
      data-tour="environmental-layers-panel"
      variant="default"
    >
      <CardHeader className="environmental-layers-panel__header">
        <div>
          <CardTitle as="h3">Environmental layers</CardTitle>
          <CardDescription>
            Contextual soil surfaces rendered independently from observation records.
          </CardDescription>
        </div>
        <span className="environmental-layers-panel__count">{layers.length} active</span>
      </CardHeader>

      <CardContent className="environmental-layers-panel__content">
        {layers.length === 0 ? (
          <div className="environmental-layers-panel__state">
            No environmental layers are active in the session. Open Sources to add SoilGrids context layers for the current workspace.
          </div>
        ) : (
          <ul className="environmental-layers-panel__list">
            {layers.map((layer) => (
              <li className="environmental-layers-panel__item" key={layer.id}>
                <div className="environmental-layers-panel__item-row">
                  <Switch
                    checked={layer.isVisible}
                    id={`environmental-layer-${layer.id}`}
                    label={layer.label}
                    onChange={(event) =>
                      onSetLayerVisibility(layer.id, event.target.checked)
                    }
                  />
                  <AppButton
                    aria-label={`Remove ${layer.label}`}
                    className="environmental-layers-panel__icon-button"
                    onClick={() => onRemoveLayer(layer.id)}
                    title="Remove layer"
                    variant="secondary"
                  >
                    <LuTrash2 aria-hidden="true" />
                  </AppButton>
                </div>

                <p className="environmental-layers-panel__description">
                  {layer.description}
                </p>

                <div className="environmental-layers-panel__meta">
                  <span>Property: {layer.propertyLabel}</span>
                  <span>Depth: {layer.depthLabel}</span>
                  <span>Statistic: {layer.statisticLabel}</span>
                  <span>Unit: {layer.unit}</span>
                </div>

                <div className="environmental-layers-panel__legend">
                  <SoilGridsLegendBar layer={layer} />
                </div>

                <div className="environmental-layers-panel__slider">
                  <span>Opacity</span>
                  <Slider
                    aria-label={`Opacity for ${layer.label}`}
                    max={100}
                    min={15}
                    onChange={(value) => onSetLayerOpacity(layer.id, value / 100)}
                    step={5}
                    value={Math.round(layer.opacity * 100)}
                  />
                  <strong>{Math.round(layer.opacity * 100)}%</strong>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
