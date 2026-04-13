import { useEffect, useState } from 'react'
import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { GbifOccurrenceDetail } from '@/features/connectors/gbif/api/request-gbif-occurrence-detail'
import type { ConnectorDatasetProvenance } from '@/features/connectors/types/connector-dataset'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataAttribute,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Skeleton,
} from 'boulder-ui'
import type { Feature, Geometry } from 'geojson'
import {
  LuChevronLeft,
  LuChevronRight,
  LuExpand,
  LuRotateCcw,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu'
import { InspectorActions } from '@/features/feature-inspector/components/inspector-actions'
import { InspectorProvenanceSection } from '@/features/feature-inspector/components/inspector-provenance-section'
import {
  formatAttributeLabel,
  formatObservedDate,
} from '@/features/feature-inspector/lib/feature-inspector-formatters'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
import { AppButton } from '@/shared/ui/app-button/app-button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import './feature-inspector-panel.css'

interface FeatureInspectorPanelProps {
  baseDataset: DatasetMetadata
  connectorProvenance?: ConnectorDatasetProvenance | null
  feature: Feature<Geometry, FeatureProperties> | null
  gbifDetail?: GbifOccurrenceDetail | null
  gbifDetailError?: string | null
  isGbifDetailLoading?: boolean
  navigation?: {
    currentIndex: number
    total: number
    onNext: () => void
    onPrevious: () => void
  } | null
  onCenterFeature: () => void
}

const mediaZoomLevels = [100, 125, 150, 200, 250, 300] as const
type MediaZoomLevel = (typeof mediaZoomLevels)[number]
const hiddenRawAttributeKeys = new Set([
  'issues',
  'requestPreview',
])

export function FeatureInspectorPanel({
  baseDataset,
  connectorProvenance = null,
  feature,
  gbifDetail = null,
  gbifDetailError = null,
  isGbifDetailLoading = false,
  navigation = null,
  onCenterFeature,
}: FeatureInspectorPanelProps) {
  const setSelection = useMapUiStore((state) => state.setSelection)
  const properties = feature?.properties ?? null
  const rawAttributes = Object.entries(properties?.rawAttributes ?? {}).filter(
    ([key, value]) =>
      !hiddenRawAttributeKeys.has(key) &&
      value.trim() !== '',
  )
  const isGeologyFeature = properties?.category === 'geology'
  const primaryMedia = gbifDetail?.media[0] ?? null
  const [isMediaLoaded, setIsMediaLoaded] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaZoomLevel, setMediaZoomLevel] = useState<MediaZoomLevel>(100)
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
  const geologyAttributes = properties
    ? {
        lithology: properties.rawAttributes?.lithology ?? properties.municipality,
        bestInterval: properties.rawAttributes?.bestInterval ?? properties.biome,
        topInterval: properties.rawAttributes?.topInterval ?? 'Not provided',
        bottomInterval: properties.rawAttributes?.bottomInterval ?? 'Not provided',
        topAgeMa: properties.rawAttributes?.topAgeMa ?? 'Not provided',
        bottomAgeMa: properties.rawAttributes?.bottomAgeMa ?? 'Not provided',
        stratName: properties.rawAttributes?.stratName ?? properties.scientificName ?? 'Not provided',
        sourceReference: properties.rawAttributes?.sourceReference ?? 'Not provided',
        description: properties.rawAttributes?.description ?? 'Not provided',
      }
    : null

  useEffect(() => {
    setIsMediaLoaded(false)
  }, [primaryMedia?.cachedUrl])

  useEffect(() => {
    setIsMediaModalOpen(false)
    setMediaZoomLevel(100)
  }, [primaryMedia?.cachedUrl, properties?.id])

  const shouldShowGbifMediaSkeleton =
    !isGeologyFeature &&
    (properties?.category === 'flora' || properties?.category === 'fauna') &&
    (isGbifDetailLoading || (primaryMedia !== null && !isMediaLoaded))
  const mediaZoomClassName = `feature-inspector-panel__media-stage-image--zoom-${mediaZoomLevel}`

  function handleZoomIn() {
    setMediaZoomLevel((currentValue) => {
      const currentIndex = mediaZoomLevels.indexOf(currentValue)
      return mediaZoomLevels[Math.min(currentIndex + 1, mediaZoomLevels.length - 1)]
    })
  }

  function handleZoomOut() {
    setMediaZoomLevel((currentValue) => {
      const currentIndex = mediaZoomLevels.indexOf(currentValue)
      return mediaZoomLevels[Math.max(currentIndex - 1, 0)]
    })
  }

  return (
    <Card className="feature-inspector-panel" data-tour="feature-inspector-panel" variant="default">
      <CardHeader className="feature-inspector-panel__header">
        <div className="feature-inspector-panel__header-copy">
          <CardTitle as="h3">
            {properties?.title ?? 'No selected feature'}
          </CardTitle>
          <CardDescription>
            Selected feature properties and inspection context.
          </CardDescription>
          {navigation && navigation.total > 1 ? (
            <div className="feature-inspector-panel__navigation">
              <AppButton
                aria-label="Inspect previous feature"
                className="feature-inspector-panel__navigation-button"
                onClick={navigation.onPrevious}
                variant="secondary"
              >
                <LuChevronLeft aria-hidden="true" />
              </AppButton>
              <span className="feature-inspector-panel__navigation-label">
                {navigation.currentIndex + 1} / {navigation.total}
              </span>
              <AppButton
                aria-label="Inspect next feature"
                className="feature-inspector-panel__navigation-button"
                onClick={navigation.onNext}
                variant="secondary"
              >
                <LuChevronRight aria-hidden="true" />
              </AppButton>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="feature-inspector-panel__content">
        {properties ? (
          <>
          <StatusBadge label={properties.status} tone={properties.status} />
          {shouldShowGbifMediaSkeleton ? (
            <figure className="feature-inspector-panel__media">
              <Skeleton
                className="feature-inspector-panel__media-skeleton"
                variant="rectangular"
              />
              <div className="feature-inspector-panel__media-caption">
                <Skeleton width="72%" />
                <Skeleton width="48%" />
              </div>
            </figure>
          ) : null}
          {primaryMedia ? (
            <figure className="feature-inspector-panel__media">
              <img
                alt={gbifDetail?.scientificName ?? properties.title}
                className={`feature-inspector-panel__media-image${isMediaLoaded ? ' feature-inspector-panel__media-image--loaded' : ''}`}
                onLoad={() => setIsMediaLoaded(true)}
                src={primaryMedia.cachedUrl}
              />
              {isMediaLoaded ? (
                <AppButton
                  aria-label="Open image preview"
                  className="feature-inspector-panel__media-action"
                  onClick={() => setIsMediaModalOpen(true)}
                  title="Open image"
                  variant="secondary"
                >
                  <LuExpand aria-hidden="true" />
                </AppButton>
              ) : null}
              <figcaption className="feature-inspector-panel__media-caption">
                <span>{primaryMedia.title ?? 'Occurrence media'}</span>
                <span>
                  {primaryMedia.license ?? gbifDetail?.license ?? 'License not provided'}
                </span>
              </figcaption>
            </figure>
          ) : null}
          <p className="feature-inspector-panel__summary">{properties.summary}</p>

          {feature ? (
            <InspectorActions
              feature={feature}
              gbifDetail={gbifDetail}
              onCenterFeature={onCenterFeature}
            />
          ) : null}

          <InspectorProvenanceSection
            baseDataset={baseDataset}
            connectorProvenance={connectorProvenance}
          />

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
            {gbifDetail?.vernacularName ? (
              <DataAttribute
                label="Common name"
                orientation="vertical"
                value={gbifDetail.vernacularName}
              />
            ) : null}
            <DataAttribute
              label="Observed at"
              orientation="vertical"
              value={
                isGeologyFeature
                  ? 'Not applicable'
                  : gbifDetail?.eventDate
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

          {isGeologyFeature && geologyAttributes ? (
            <>
              <div className="feature-inspector-panel__grid">
                <DataAttribute
                  label="Lithology"
                  orientation="vertical"
                  value={geologyAttributes.lithology}
                />
                <DataAttribute
                  label="Geologic interval"
                  orientation="vertical"
                  value={geologyAttributes.bestInterval}
                />
                <DataAttribute
                  label="Top age (Ma)"
                  orientation="vertical"
                  value={geologyAttributes.topAgeMa}
                />
                <DataAttribute
                  label="Bottom age (Ma)"
                  orientation="vertical"
                  value={geologyAttributes.bottomAgeMa}
                />
                <DataAttribute
                  label="Stratigraphic name"
                  orientation="vertical"
                  value={geologyAttributes.stratName}
                />
                <DataAttribute
                  label="Source reference"
                  orientation="vertical"
                  value={geologyAttributes.sourceReference}
                />
              </div>

              {geologyAttributes.description !== 'Not provided' ? (
                <div className="feature-inspector-panel__attributes">
                  <h4 className="feature-inspector-panel__attributes-title">
                    Geologic description
                  </h4>
                  <p className="feature-inspector-panel__summary">
                    {geologyAttributes.description}
                  </p>
                </div>
              ) : null}
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

      {primaryMedia ? (
        <Modal
          isOpen={isMediaModalOpen}
          onClose={() => {
            setIsMediaModalOpen(false)
            setMediaZoomLevel(100)
          }}
          size="full"
          variant="glass"
        >
          <ModalHeader>
            <ModalTitle>
              {gbifDetail?.scientificName ?? properties?.title ?? 'Occurrence image'}
            </ModalTitle>
          </ModalHeader>
          <ModalContent className="feature-inspector-panel__media-modal" padding="sm">
            <div className="feature-inspector-panel__media-toolbar">
              <AppButton
                aria-label="Zoom out image"
                className="feature-inspector-panel__media-toolbar-button"
                disabled={mediaZoomLevel === mediaZoomLevels[0]}
                onClick={handleZoomOut}
                variant="secondary"
              >
                <LuZoomOut aria-hidden="true" />
              </AppButton>
              <span className="feature-inspector-panel__media-zoom-label">
                {mediaZoomLevel}%
              </span>
              <AppButton
                aria-label="Reset image zoom"
                className="feature-inspector-panel__media-toolbar-button"
                onClick={() => setMediaZoomLevel(100)}
                variant="secondary"
              >
                <LuRotateCcw aria-hidden="true" />
              </AppButton>
              <AppButton
                aria-label="Zoom in image"
                className="feature-inspector-panel__media-toolbar-button"
                disabled={mediaZoomLevel === mediaZoomLevels[mediaZoomLevels.length - 1]}
                onClick={handleZoomIn}
                variant="secondary"
              >
                <LuZoomIn aria-hidden="true" />
              </AppButton>
            </div>
            <div className="feature-inspector-panel__media-stage">
              <img
                alt={gbifDetail?.scientificName ?? properties?.title ?? 'Occurrence image'}
                className={`feature-inspector-panel__media-stage-image ${mediaZoomClassName}`}
                src={primaryMedia.cachedUrl}
              />
            </div>
          </ModalContent>
        </Modal>
      ) : null}
    </Card>
  )
}
