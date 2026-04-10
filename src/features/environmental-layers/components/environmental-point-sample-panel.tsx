import { Alert, Card, CardContent, CardHeader, CardTitle, DataAttribute } from 'boulder-ui'

import type { SoilGridsPointSample } from '@/features/environmental-layers/types/environmental-layer'

import './environmental-point-sample-panel.css'

interface EnvironmentalPointSamplePanelProps {
  coordinates: [number, number] | null
  errorMessage: string | null
  isLoading: boolean
  samples: SoilGridsPointSample[]
}

function formatCoordinate(value: number) {
  return value.toFixed(4)
}

function formatSampleValue(sample: SoilGridsPointSample) {
  if (sample.value === null) {
    return 'No data'
  }

  return `${sample.value.toFixed(2)} ${sample.unit}`
}

export function EnvironmentalPointSamplePanel({
  coordinates,
  errorMessage,
  isLoading,
  samples,
}: EnvironmentalPointSamplePanelProps) {
  if (!coordinates && !errorMessage && !isLoading) {
    return null
  }

  return (
    <Card className="environmental-point-sample-panel" variant="default">
      <CardHeader>
        <CardTitle as="h3">SoilGrids point sample</CardTitle>
      </CardHeader>

      <CardContent className="environmental-point-sample-panel__content">
        {coordinates ? (
          <div className="environmental-point-sample-panel__coordinates">
            <DataAttribute
              label="Longitude"
              orientation="vertical"
              value={formatCoordinate(coordinates[0])}
            />
            <DataAttribute
              label="Latitude"
              orientation="vertical"
              value={formatCoordinate(coordinates[1])}
            />
          </div>
        ) : null}

        {isLoading ? (
          <p className="environmental-point-sample-panel__message">
            Sampling SoilGrids values for the selected location.
          </p>
        ) : null}

        {errorMessage ? (
          <Alert variant="danger">{errorMessage}</Alert>
        ) : null}

        {samples.length > 0 ? (
          <ul className="environmental-point-sample-panel__list">
            {samples.map((sample) => (
              <li className="environmental-point-sample-panel__item" key={`${sample.propertyId}-${sample.depthId}-${sample.statisticId}`}>
                <strong>{sample.propertyLabel}</strong>
                <span>{sample.depthLabel}</span>
                <span>{sample.statisticLabel}</span>
                <span>{formatSampleValue(sample)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
