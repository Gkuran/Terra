import { useState } from 'react'

import type { Feature, Geometry } from 'geojson'
import { LuCopy, LuExternalLink, LuLocateFixed } from 'react-icons/lu'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { GbifOccurrenceDetail } from '@/features/connectors/gbif/api/request-gbif-occurrence-detail'
import { formatFeatureCoordinates } from '@/features/feature-inspector/lib/feature-inspector-geometry'
import { AppButton } from '@/shared/ui/app-button/app-button'

interface InspectorActionsProps {
  feature: Feature<Geometry, FeatureProperties>
  gbifDetail?: GbifOccurrenceDetail | null
  onCenterFeature: () => void
}

function getExternalReference(
  feature: Feature<Geometry, FeatureProperties>,
  gbifDetail: GbifOccurrenceDetail | null,
) {
  if (gbifDetail?.gbifUrl) {
    return {
      href: gbifDetail.gbifUrl,
      label: 'Open on GBIF',
    }
  }

  const sourceReference = feature.properties.rawAttributes?.sourceReference

  if (sourceReference && /^https?:\/\//.test(sourceReference)) {
    return {
      href: sourceReference,
      label: 'Open source reference',
    }
  }

  return null
}

export function InspectorActions({
  feature,
  gbifDetail = null,
  onCenterFeature,
}: InspectorActionsProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const coordinatesLabel = formatFeatureCoordinates(feature)
  const externalReference = getExternalReference(feature, gbifDetail)

  async function handleCopyCoordinates() {
    if (!coordinatesLabel) {
      setCopyFeedback('Coordinates unavailable')
      return
    }

    try {
      await navigator.clipboard.writeText(coordinatesLabel)
      setCopyFeedback('Coordinates copied')
    } catch {
      setCopyFeedback('Clipboard unavailable')
    }
  }

  return (
    <div className="feature-inspector-panel__actions">
      <AppButton
        aria-label="Center feature on map"
        className="feature-inspector-panel__action-button"
        onClick={onCenterFeature}
        title="Center on map"
        variant="secondary"
      >
        <LuLocateFixed aria-hidden="true" />
      </AppButton>
      <AppButton
        aria-label={copyFeedback ?? 'Copy feature coordinates'}
        className="feature-inspector-panel__action-button"
        onClick={handleCopyCoordinates}
        title={copyFeedback ?? 'Copy coordinates'}
        variant="secondary"
      >
        <LuCopy aria-hidden="true" />
      </AppButton>
      {externalReference ? (
        <AppButton
          aria-label={externalReference.label}
          className="feature-inspector-panel__action-button"
          onClick={() => window.open(externalReference.href, '_blank', 'noreferrer')}
          title={externalReference.label}
          variant="secondary"
        >
          <LuExternalLink aria-hidden="true" />
        </AppButton>
      ) : null}
    </div>
  )
}
