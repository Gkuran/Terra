import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Slider,
  Switch,
  Tag,
} from 'boulder-ui'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import { useLayerPresentationStore } from '@/features/layers/stores/use-layer-presentation-store'

import './layer-control-panel.css'

interface LayerControlPanelProps {
  activeDataset: DatasetMetadata
  layers: LayerMetadata[]
}

export function LayerControlPanel({
  activeDataset,
  layers,
}: LayerControlPanelProps) {
  const visibilityById = useLayerPresentationStore((state) => state.visibilityById)
  const opacityById = useLayerPresentationStore((state) => state.opacityById)
  const setLayerVisibility = useLayerPresentationStore(
    (state) => state.setLayerVisibility,
  )
  const setLayerOpacity = useLayerPresentationStore((state) => state.setLayerOpacity)

  return (
    <Card className="layer-control-panel" variant="default">
      <CardHeader className="layer-control-panel__header">
        <div>
          <CardTitle as="h3">{activeDataset.name}</CardTitle>
          <CardDescription>{activeDataset.description}</CardDescription>
        </div>
        <span className="layer-control-panel__count">{layers.length} layers</span>
      </CardHeader>

      <CardContent className="layer-control-panel__content">
        <div className="layer-control-panel__filters">
          {activeDataset.tags.map((tag) => (
            <Tag className="layer-control-panel__tag" key={tag} variant="primary">
              {tag}
            </Tag>
          ))}
        </div>

        {layers.length === 0 ? (
          <div className="layer-control-panel__state">
            No layers are available for this dataset in the selected scenario.
          </div>
        ) : (
          <ul className="layer-control-panel__list">
            {layers.map((layer) => {
              const isVisible = visibilityById[layer.id] ?? layer.isVisibleByDefault
              const opacity = opacityById[layer.id] ?? layer.defaultOpacity

              return (
                <li className="layer-control-panel__item" key={layer.id}>
                  <div className="layer-control-panel__item-row">
                    <Switch
                      checked={isVisible}
                      id={`layer-visibility-${layer.id}`}
                      label={layer.name}
                      onChange={(event) =>
                        setLayerVisibility(layer.id, event.target.checked)
                      }
                    />
                    <span className="layer-control-panel__color-code">{layer.color}</span>
                  </div>

                  <p className="layer-control-panel__legend">{layer.legendLabel}</p>

                  <div className="layer-control-panel__slider">
                    <span>Opacity</span>
                    <Slider
                      aria-label={`Opacity for ${layer.name}`}
                      max={100}
                      min={10}
                      onChange={(value) => setLayerOpacity(layer.id, value / 100)}
                      step={5}
                      value={Math.round(opacity * 100)}
                    />
                    <strong>{Math.round(opacity * 100)}%</strong>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
