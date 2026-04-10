import { Card, CardContent, CardHeader, CardTitle } from 'boulder-ui'

import './area-query-sources-panel.css'

interface AreaQuerySourcesPanelProps {
  includeGbif: boolean
  includeMacrostrat: boolean
  onToggleGbif: () => void
  onToggleMacrostrat: () => void
}

export function AreaQuerySourcesPanel({
  includeGbif,
  includeMacrostrat,
  onToggleGbif,
  onToggleMacrostrat,
}: AreaQuerySourcesPanelProps) {
  return (
    <Card className="area-query-sources-panel" variant="default">
      <CardHeader className="area-query-sources-panel__header">
        <CardTitle as="h4">Area query sources</CardTitle>
      </CardHeader>

      <CardContent className="area-query-sources-panel__content">
        <button
          aria-pressed={includeGbif}
          className="area-query-sources-panel__toggle"
          onClick={onToggleGbif}
          type="button"
        >
          <div className="area-query-sources-panel__copy">
            <strong>GBIF occurrences</strong>
            <span>Fauna and flora records from the selected area.</span>
          </div>
          <span
            aria-hidden="true"
            className={`area-query-sources-panel__pill area-query-sources-panel__pill--${includeGbif ? 'active' : 'inactive'}`}
          >
            {includeGbif ? 'On' : 'Off'}
          </span>
        </button>

        <button
          aria-pressed={includeMacrostrat}
          className="area-query-sources-panel__toggle"
          onClick={onToggleMacrostrat}
          type="button"
        >
          <div className="area-query-sources-panel__copy">
            <strong>Macrostrat geology</strong>
            <span>Geologic units and lithology polygons sampled from the selected area.</span>
          </div>
          <span
            aria-hidden="true"
            className={`area-query-sources-panel__pill area-query-sources-panel__pill--${includeMacrostrat ? 'active' : 'inactive'}`}
          >
            {includeMacrostrat ? 'On' : 'Off'}
          </span>
        </button>
      </CardContent>
    </Card>
  )
}
