import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { GbifOccurrenceDetail } from '@/features/connectors/gbif/api/request-gbif-occurrence-detail'
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
  gbifDetail?: GbifOccurrenceDetail | null
  gbifDetailError?: string | null
  isGbifDetailLoading?: boolean
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

export function FeatureInspectorPanel({
  feature,
  gbifDetail = null,
  gbifDetailError = null,
  isGbifDetailLoading = false,
}: FeatureInspectorPanelProps) {
  const setSelection = useMapUiStore((state) => state.setSelection)
  const properties = feature?.properties ?? null
  const rawAttributes = Object.entries(properties?.rawAttributes ?? {})
  const primaryMedia = gbifDetail?.media[0] ?? null
  const taxonomyEntries = gbifDetail
    ? [
        ['Kingdom', gbifDetail.taxonomy.kingdom],
        ['Phylum', gbifDetail.taxonomy.phylum],
        ['Order', gbifDetail.taxonomy.order],
        ['Family', gbifDetail.taxonomy.family],
        ['Genus', gbifDetail.taxonomy.genus],
        ['Species', gbifDetail.taxonomy.species],
      ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    : []

  return (
    <Card className="feature-inspector-panel" variant="default">
      <CardHeader className="feature-inspector-panel__header">
        <div>
          <CardTitle as="h3">
            {properties?.title ?? 'No selected feature'}
          </CardTitle>
          <CardDescription>
            Selected feature properties and inspection context.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="feature-inspector-panel__content">
        {properties ? (
          <>
          <StatusBadge label={properties.status} tone={properties.status} />
          {primaryMedia ? (
            <figure className="feature-inspector-panel__media">
              <img
                alt={gbifDetail?.scientificName ?? properties.title}
                className="feature-inspector-panel__media-image"
                src={primaryMedia.cachedUrl}
              />
              <figcaption className="feature-inspector-panel__media-caption">
                <span>{primaryMedia.title ?? 'Occurrence media'}</span>
                <span>
                  {primaryMedia.license ?? gbifDetail?.license ?? 'License not provided'}
                </span>
              </figcaption>
            </figure>
          ) : null}
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
              value={gbifDetail?.scientificName ?? properties.scientificName ?? 'Not provided'}
            />
            <DataAttribute
              label="Observed at"
              orientation="vertical"
              value={
                gbifDetail?.eventDate
                  ? formatObservedDate(gbifDetail.eventDate)
                  : formatObservedDate(properties.observedAt)
              }
            />
          </div>

          {isGbifDetailLoading ? (
            <p className="feature-inspector-panel__note">
              Loading GBIF occurrence detail.
            </p>
          ) : null}

          {gbifDetailError ? (
            <p className="feature-inspector-panel__note feature-inspector-panel__note--error">
              {gbifDetailError}
            </p>
          ) : null}

          {gbifDetail ? (
            <>
              <div className="feature-inspector-panel__grid">
                <DataAttribute
                  label="Basis of record"
                  orientation="vertical"
                  value={gbifDetail.basisOfRecord ?? 'Not provided'}
                />
                <DataAttribute
                  label="Recorded by"
                  orientation="vertical"
                  value={gbifDetail.recordedBy ?? 'Not provided'}
                />
                <DataAttribute
                  label="Dataset"
                  orientation="vertical"
                  value={gbifDetail.datasetName ?? 'Not provided'}
                />
                <DataAttribute
                  label="Publisher"
                  orientation="vertical"
                  value={gbifDetail.publisher ?? 'Not provided'}
                />
                <DataAttribute
                  label="Locality"
                  orientation="vertical"
                  value={gbifDetail.locality ?? 'Not provided'}
                />
                <DataAttribute
                  label="Occurrence key"
                  orientation="vertical"
                  value={`${gbifDetail.occurrenceKey}`}
                />
              </div>

              {taxonomyEntries.length > 0 ? (
                <div className="feature-inspector-panel__attributes">
                  <h4 className="feature-inspector-panel__attributes-title">
                    Taxonomy
                  </h4>
                  <div className="feature-inspector-panel__grid">
                    {taxonomyEntries.map(([label, value]) => (
                      <DataAttribute
                        key={label}
                        label={label}
                        orientation="vertical"
                        value={value}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="feature-inspector-panel__links">
                <a
                  className="feature-inspector-panel__link"
                  href={gbifDetail.gbifUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open on GBIF
                </a>
                {gbifDetail.references ? (
                  <a
                    className="feature-inspector-panel__link"
                    href={gbifDetail.references}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source record
                  </a>
                ) : null}
              </div>
            </>
          ) : null}

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
