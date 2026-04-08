import type { ChangeEvent } from 'react'
import { useId, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Select,
} from 'boulder-ui'
import type { FeatureCollection, Geometry, Polygon } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { ConnectorLegendPanel } from '@/features/connectors/components/connector-legend-panel'
import { ConnectorsModal } from '@/features/connectors/components/connectors-modal'
import { searchOccurrencesByBbox } from '@/features/connectors/bbox/lib/search-occurrences-by-bbox'
import { useConnectorDatasetsStore } from '@/features/connectors/stores/use-connector-datasets-store'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import { FeatureInspectorPanel } from '@/features/feature-inspector/components/feature-inspector-panel'
import { LayerControlPanel } from '@/features/layers/components/layer-control-panel'
import type { MapViewScenario } from '@/features/map/api/get-map-view-data'
import { MapCanvas } from '@/features/map/components/map-canvas'
import { MapToolbar } from '@/features/map/components/map-toolbar'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
import type { MapBoundingBox } from '@/features/map/types/map-bounding-box'
import { UploadShapefileModal } from '@/features/shapefile-upload/components/upload-shapefile-modal'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'
import { QueryFeedbackBanner } from '@/shared/ui/query-feedback-banner/query-feedback-banner'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TerraFooter } from '@/shared/ui/terra-footer/terra-footer'
import { TerraHeader } from '@/shared/ui/terra-header/terra-header'

import './map-view-page.css'

interface MapViewPageProps {
  dataset: DatasetMetadata
  datasets: DatasetMetadata[]
  features: FeatureCollection<Polygon, FeatureProperties>
  layers: LayerMetadata[]
  scenario: MapViewScenario
  stateMessage?: string
  uploadHistory: UploadResult[]
  onDatasetChange: (datasetId: string) => void
  onScenarioChange: (scenario: MapViewScenario) => void
}

const scenarioOptions: Array<{ label: string; value: MapViewScenario }> = [
  { label: 'Operational', value: 'default' },
  { label: 'Loading', value: 'loading' },
  { label: 'Empty', value: 'empty' },
  { label: 'Error', value: 'error' },
]

export function MapViewPage({
  dataset,
  datasets,
  features,
  layers,
  scenario,
  stateMessage,
  uploadHistory,
  onDatasetChange,
  onScenarioChange,
}: MapViewPageProps) {
  const datasetFieldId = useId()
  const scenarioFieldId = useId()
  const selection = useMapUiStore((state) => state.selection)
  const hoveredFeatureId = useMapUiStore((state) => state.hoveredFeatureId)
  const setHoveredFeatureId = useMapUiStore((state) => state.setHoveredFeatureId)
  const setSelection = useMapUiStore((state) => state.setSelection)
  const connectorDatasets = useConnectorDatasetsStore((state) => state.datasets)
  const addConnectorDataset = useConnectorDatasetsStore((state) => state.addDataset)
  const clearConnectorDatasets = useConnectorDatasetsStore((state) => state.clearDatasets)
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null)
  const [bboxSearchError, setBboxSearchError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'session' | 'layers' | null>(null)
  const bboxSearchMutation = useMutation({
    mutationFn: searchOccurrencesByBbox,
    onMutate: () => {
      setBboxSearchError(null)
    },
    onSuccess: ({ featureCollection, queryLabel, resultCount }) => {
      addConnectorDataset({
        collection: featureCollection,
        label: queryLabel,
        sourceType: 'gbif',
      })
      setLastUploadResult({
        id: `bbox-${Date.now()}`,
        sourceName: queryLabel,
        featureCount: resultCount,
        importedAt: new Date().toISOString(),
        status: 'success',
        message: 'Occurrences were fetched from the backend bbox search.',
      })
    },
    onError: (error) => {
      setBboxSearchError(error.message)
    },
  })
  const selectedFeature = useMemo(
    () => {
      const combinedFeatures = [
        ...features.features,
        ...connectorDatasets.flatMap((entry) => entry.collection.features),
      ]

      return (
        combinedFeatures.find(
          (feature) => feature.properties.id === selection?.featureId,
        ) ?? null
      )
    },
    [connectorDatasets, features.features, selection?.featureId],
  )
  const hoveredFeature = useMemo(
    () => {
      if (!hoveredFeatureId) {
        return null
      }

      const combinedFeatures = [
        ...features.features,
        ...connectorDatasets.flatMap((entry) => entry.collection.features),
      ]

      return (
        combinedFeatures.find(
          (feature) => feature.properties.id === hoveredFeatureId,
        ) ?? null
      )
    },
    [connectorDatasets, features.features, hoveredFeatureId],
  )
  const hoverTargetLabel =
    hoveredFeature?.properties.scientificName ??
    hoveredFeature?.properties.title ??
    hoveredFeatureId ??
    'No hover target'
  const visibleFeatureCount =
    features.features.length +
    connectorDatasets.reduce(
      (total, entry) => total + entry.collection.features.length,
      0,
    )

  function handleUploadComplete(
    collection: FeatureCollection<Geometry, FeatureProperties>,
    result: UploadResult,
  ) {
    addConnectorDataset({
      collection,
      label: result.sourceName,
      sourceType: 'shapefile',
    })
    setLastUploadResult(result)
  }

  function handleClearAllConnectorDatasets() {
    clearConnectorDatasets()
    setHoveredFeatureId(null)
    setSelection(null)
  }

  function handleDatasetChange(event: ChangeEvent<HTMLSelectElement>) {
    onDatasetChange(event.target.value)
  }

  function handleScenarioChange(event: ChangeEvent<HTMLSelectElement>) {
    onScenarioChange(event.target.value as MapViewScenario)
  }

  function handleBoundingBoxComplete(bbox: MapBoundingBox) {
    bboxSearchMutation.mutate(bbox)
  }

  return (
    <main className="map-view-page">
      <TerraHeader activeDataset={dataset} />

      <MapCanvas
        connectorDatasets={connectorDatasets}
        features={features}
        layers={layers}
        onBoundingBoxComplete={handleBoundingBoxComplete}
      />

      <div className="map-view-page__dock">
        <MapToolbar
          activePanel={activePanel}
          onOpenConnectors={() => setIsConnectorsModalOpen(true)}
          onOpenPanel={(panel) =>
            setActivePanel((current) => (current === panel ? null : panel))
          }
        />
      </div>

      <QueryFeedbackBanner
        errorMessage={bboxSearchError}
        isLoading={bboxSearchMutation.isPending}
        loadingLabel="Querying fauna and flora occurrences for the selected area."
      />

      {connectorDatasets.length > 0 ? (
        <aside className="map-view-page__legend">
          <ConnectorLegendPanel
            datasets={connectorDatasets}
            onClearAll={handleClearAllConnectorDatasets}
          />
        </aside>
      ) : null}

      {activePanel ? (
        <aside className="map-view-page__panel">
          {activePanel === 'session' ? (
            <Card className="map-view-page__workspace-card" variant="glass">
              <CardHeader>
                <CardTitle as="h3">Dataset session</CardTitle>
                <CardDescription>
                  Configure the active dataset and preview transport states.
                </CardDescription>
              </CardHeader>
              <CardContent className="map-view-page__workspace-card-content">
                <div className="map-view-page__toolbar-fields">
                  <FormField id={datasetFieldId} label="Dataset">
                    <Select
                      id={datasetFieldId}
                      onChange={handleDatasetChange}
                      value={dataset.id}
                    >
                      {datasets.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField id={scenarioFieldId} label="State">
                    <Select
                      id={scenarioFieldId}
                      onChange={handleScenarioChange}
                      value={scenario}
                    >
                      {scenarioOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="map-view-page__session-metrics">
                  <div className="map-view-page__session-metric">
                    <span>Region</span>
                    <strong>{dataset.regionLabel}</strong>
                  </div>
                  <div className="map-view-page__session-metric">
                    <span>Last upload</span>
                    <strong>{lastUploadResult?.sourceName ?? 'Ready to import'}</strong>
                  </div>
                </div>

                {stateMessage ? (
                  <Alert
                    heading={`${scenario.charAt(0).toUpperCase()}${scenario.slice(1)} state`}
                    variant={scenario === 'error' ? 'danger' : 'info'}
                  >
                    {stateMessage}
                  </Alert>
                ) : null}

              </CardContent>
            </Card>
          ) : (
            <LayerControlPanel
              activeDataset={dataset}
              layers={layers}
            />
          )}
        </aside>
      ) : null}

      {selectedFeature ? (
        <aside className="map-view-page__inspector">
          <FeatureInspectorPanel feature={selectedFeature} />
          <div className="map-view-page__inspector-summary">
            <div className="map-view-page__session-metric">
              <span>Visible features</span>
              <strong>{visibleFeatureCount}</strong>
            </div>
            <div className="map-view-page__session-metric">
              <span>Status</span>
              <StatusBadge
                label={dataset.status}
                tone={dataset.status === 'processing' ? 'processing' : 'ready'}
              />
            </div>
          </div>
        </aside>
      ) : null}

      <TerraFooter
        credit="Created by Gabriel Adornes"
        hoverTarget={hoverTargetLabel}
      />

      <UploadShapefileModal
        isOpen={isUploadModalOpen}
        lastUploadResult={lastUploadResult}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(collection, result) => {
          handleUploadComplete(collection, result)
          setIsUploadModalOpen(false)
        }}
        uploadHistory={uploadHistory}
      />

      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
        onConnectGbif={({ collection, sourceName }) => {
          addConnectorDataset({
            collection,
            label: sourceName,
            sourceType: 'gbif',
          })
          setLastUploadResult({
            id: `gbif-${Date.now()}`,
            sourceName,
            featureCount: collection.features.length,
            importedAt: new Date().toISOString(),
            status: 'success',
            message: 'Occurrences were fetched live from GBIF.',
          })
          setIsConnectorsModalOpen(false)
        }}
        onImportCsv={({ collection, sourceName }) => {
          addConnectorDataset({
            collection,
            label: sourceName,
            sourceType: 'csv',
          })
          setLastUploadResult({
            id: `csv-${Date.now()}`,
            sourceName,
            featureCount: collection.features.length,
            importedAt: new Date().toISOString(),
            status: 'success',
            message: 'Scientific records were imported from CSV.',
          })
          setIsConnectorsModalOpen(false)
        }}
        onOpenShapefileImport={() => {
          setIsConnectorsModalOpen(false)
          setIsUploadModalOpen(true)
        }}
      />
    </main>
  )
}
