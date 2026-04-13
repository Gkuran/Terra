import { Card, CardContent, CardHeader, CardTitle, Tag } from 'boulder-ui'
import { LuX } from 'react-icons/lu'

import { AppButton } from '@/shared/ui/app-button/app-button'

import './workspace-start-card.css'

interface WorkspaceStartCardProps {
  onDismiss: () => void
  onOpenSources: () => void
  onOpenTour: () => void
}

export function WorkspaceStartCard({
  onDismiss,
  onOpenSources,
  onOpenTour,
}: WorkspaceStartCardProps) {
  return (
    <Card className="workspace-start-card" variant="default">
      <CardHeader className="workspace-start-card__header">
        <CardTitle as="h3">Start a BGSR session</CardTitle>
        <AppButton
          aria-label="Dismiss start card"
          className="workspace-start-card__dismiss"
          onClick={onDismiss}
          title="Dismiss"
          variant="ghost"
        >
          <LuX aria-hidden="true" />
        </AppButton>
      </CardHeader>

      <CardContent className="workspace-start-card__content">
        <div className="workspace-start-card__copy">
          <p>
            Import a dataset, connect live observations, add an environmental layer,
            or restore a saved BGSR session to begin working on the map.
          </p>
          <div>
            <Tag variant="primary">CSV</Tag>{' '}
            <Tag variant="primary">Shapefile</Tag>{' '}
            <Tag variant="primary">GBIF</Tag>{' '}
            <Tag variant="primary">BGSR session</Tag>
          </div>
        </div>

        <div className="workspace-start-card__actions">
          <AppButton onClick={onOpenSources} variant="primary">
            Open sources
          </AppButton>
          <AppButton onClick={onOpenTour} variant="secondary">
            Start tour
          </AppButton>
        </div>
      </CardContent>
    </Card>
  )
}
