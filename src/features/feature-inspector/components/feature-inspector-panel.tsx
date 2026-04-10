import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataAttribute,
} from 'boulder-ui'
import type { Feature, Geometry } from 'geojson'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
import { AppButton } from '@/shared/ui/app-button/app-button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import './feature-inspector-panel.css'

interface FeatureInspectorPanelProps {
  feature: Feature<Geometry, FeatureProperties> | null
}

function formatObservedDate(isoDate: string) {
  const parsedDate = new Date(isoDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not provided'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

function formatAttributeLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function FeatureInspectorPanel({ feature }: FeatureInspectorPanelProps) {
  const setSelection = useMapUiStore((state) => state.setSelection)
  const properties = feature?.properties ?? null
  const rawAttributes = Object.entries(properties?.rawAttributes ?? {})

  return (
    <Card className="feature-inspector-panel" variant="default">
      <CardHeader className="feature-inspector-panel__header">
        <div>
          <CardTitle as="h3">
            {properties?.title ?? 'No selected feature'}
          </CardTitle>
          <CardDescription>
            Selected polygon properties and inspection context.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="feature-inspector-panel__content">
        {properties ? (
          <>
          <StatusBadge label={properties.status} tone={properties.status} />
          <p className="feature-inspector-panel__summary">{properties.summary}</p>

          <div className="feature-inspector-panel__grid">
            <DataAttribute
              label="Category"
              orientation="vertical"
              value={properties.category}
            />
            <DataAttribute
              label="Biome"
              orientation="vertical"
              value={properties.biome}
            />
            <DataAttribute
              label="Municipality"
              orientation="vertical"
              value={properties.municipality}
            />
            <DataAttribute
              label="Scientific name"
              orientation="vertical"
              value={properties.scientificName ?? 'Not provided'}
            />
            <DataAttribute
              label="Observed at"
              orientation="vertical"
              value={formatObservedDate(properties.observedAt)}
            />
          </div>

          {rawAttributes.length > 0 ? (
            <div className="feature-inspector-panel__attributes">
              <h4 className="feature-inspector-panel__attributes-title">
                Imported attributes
              </h4>
              <div className="feature-inspector-panel__grid">
                {rawAttributes.map(([key, value]) => (
                  <DataAttribute
                    key={key}
                    label={formatAttributeLabel(key)}
                    orientation="vertical"
                    value={value}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <AppButton
            onClick={() => {
              setSelection(null)
            }}
            variant="secondary"
          >
            Clear selection
          </AppButton>
          </>
        ) : (
          <div className="feature-inspector-panel__empty">
            Select a polygon on the map to inspect scientific properties and metadata.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
