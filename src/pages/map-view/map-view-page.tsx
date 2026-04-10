import type { ChangeEvent } from 'react'
import { useId, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import { ConnectorResultsPanel } from '@/features/connectors/components/connector-results-panel'
import { ConnectorsModal } from '@/features/connectors/components/connectors-modal'
import { AreaQuerySourcesPanel } from '@/features/connectors/components/area-query-sources-panel'
import { searchAreaDataByBbox } from '@/features/connectors/bbox/lib/search-area-data-by-bbox'
import { useConnectorDatasetsStore } from '@/features/connectors/stores/use-connector-datasets-store'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import { EnvironmentalContextPanel } from '@/features/environmental-layers/components/environmental-context-panel'
import { EnvironmentalLayersPanel } from '@/features/environmental-layers/components/environmental-layers-panel'
import { EnvironmentalPointSamplePanel } from '@/features/environmental-layers/components/environmental-point-sample-panel'
import { requestSoilGridsPointSample } from '@/features/environmental-layers/api/request-soilgrids-point-sample'
import { useEnvironmentalLayersStore } from '@/features/environmental-layers/stores/use-environmental-layers-store'
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
  const environmentalProbeCoordinates = useMapUiStore(
    (state) => state.environmentalProbeCoordinates,
  )
  const hoveredFeatureId = useMapUiStore((state) => state.hoveredFeatureId)
  const setHoveredFeatureId = useMapUiStore((state) => state.setHoveredFeatureId)
  const setEnvironmentalProbeCoordinates = useMapUiStore(
    (state) => state.setEnvironmentalProbeCoordinates,
  )
  const setSelection = useMapUiStore((state) => state.setSelection)
  const connectorDatasets = useConnectorDatasetsStore((state) => state.datasets)
  const addConnectorDataset = useConnectorDatasetsStore((state) => state.addDataset)
  const clearConnectorDatasets = useConnectorDatasetsStore((state) => state.clearDatasets)
  const removeConnectorDataset = useConnectorDatasetsStore((state) => state.removeDataset)
  const setDatasetVisibility = useConnectorDatasetsStore(
    (state) => state.setDatasetVisibility,
  )
  const environmentalLayers = useEnvironmentalLayersStore((state) => state.layers)
  const addEnvironmentalLayer = useEnvironmentalLayersStore((state) => state.addLayer)
  const removeEnvironmentalLayer = useEnvironmentalLayersStore(
    (state) => state.removeLayer,
  )
  const setEnvironmentalLayerOpacity = useEnvironmentalLayersStore(
    (state) => state.setLayerOpacity,
  )
  const setEnvironmentalLayerVisibility = useEnvironmentalLayersStore(
    (state) => state.setLayerVisibility,
  )
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null)
  const [bboxSearchError, setBboxSearchError] = useState<string | null>(null)
  const [focusDatasetId, setFocusDatasetId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'session' | 'layers' | null>(null)
  const [includeGbifInAreaQuery, setIncludeGbifInAreaQuery] = useState(true)
  const [includeMacrostratInAreaQuery, setIncludeMacrostratInAreaQuery] = useState(true)
  const visibleEnvironmentalLayers = useMemo(
    () => environmentalLayers.filter((layer) => layer.isVisible),
    [environmentalLayers],
  )
  const bboxSearchMutation = useMutation({
    mutationFn: searchAreaDataByBbox,
    onMutate: () => {
      setBboxSearchError(null)
    },
    onSuccess: ({ gbif, macrostrat, warnings }) => {
      if (gbif) {
        addConnectorDataset({
          collection: gbif.featureCollection,
          context: 'bbox',
          label: gbif.queryLabel,
          sourceType: 'gbif',
        })
      }

      if (macrostrat) {
        addConnectorDataset({
          collection: macrostrat.featureCollection,
          context: 'bbox',
          label: 'Macrostrat geology',
          sourceType: 'macrostrat',
        })
      }

      setLastUploadResult({
        id: `bbox-${Date.now()}`,
        sourceName: 'Area query',
        featureCount: (gbif?.resultCount ?? 0) + (macrostrat?.resultCount ?? 0),
        importedAt: new Date().toISOString(),
        status: 'success',
        message:
          warnings.length > 0
            ? `Area query completed with warnings: ${warnings.join(' | ')}`
            : gbif && macrostrat
              ? 'Fauna, flora, and Macrostrat geology were fetched from the selected area.'
              : gbif
                ? 'Fauna and flora occurrences were fetched from the selected area.'
                : 'Macrostrat geologic units were fetched from the selected area.',
      })
    },
    onError: (error) => {
      setBboxSearchError(error.message)
    },
  })
  const soilGridsPointSampleQuery = useQuery({
    enabled:
      visibleEnvironmentalLayers.length > 0 &&
      environmentalProbeCoordinates !== null,
    queryKey: [
      'soilgrids-point-sample',
      environmentalProbeCoordinates?.[0] ?? 'none',
      environmentalProbeCoordinates?.[1] ?? 'none',
      visibleEnvironmentalLayers.map((layer) => layer.id).join('|'),
    ],
    queryFn: () =>
      requestSoilGridsPointSample({
        lon: environmentalProbeCoordinates?.[0] ?? 0,
        lat: environmentalProbeCoordinates?.[1] ?? 0,
        layers: visibleEnvironmentalLayers.map((layer) => ({
          propertyId: layer.propertyId,
          depthId: layer.depthId,
          statisticId: layer.statisticId,
        })),
      }),
  })
  const selectedFeature = useMemo(
    () => {
      const combinedFeatures = [
        ...features.features,
        ...connectorDatasets.flatMap((entry) =>
          entry.isVisible ? entry.collection.features : [],
        ),
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
        ...connectorDatasets.flatMap((entry) =>
          entry.isVisible ? entry.collection.features : [],
        ),
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
      (total, entry) =>
        total + (entry.isVisible ? entry.collection.features.length : 0),
      0,
    )
  const bboxDatasets = connectorDatasets.filter((dataset) => dataset.context === 'bbox')
  const bboxOccurrenceDatasets = bboxDatasets.filter(
    (dataset) => dataset.sourceType === 'gbif',
  )
  const areaQueryLoadingLabel = useMemo(() => {
    if (includeGbifInAreaQuery && includeMacrostratInAreaQuery) {
      return 'Querying GBIF occurrences and Macrostrat geology for the selected area.'
    }

    if (includeGbifInAreaQuery) {
      return 'Querying GBIF occurrences for the selected area.'
    }

    if (includeMacrostratInAreaQuery) {
      return 'Querying Macrostrat geologic units for the selected area.'
    }

    return 'Select at least one source for the area query.'
  }, [includeGbifInAreaQuery, includeMacrostratInAreaQuery])

  function handleUploadComplete(
    collection: FeatureCollection<Geometry, FeatureProperties>,
    result: UploadResult,
  ) {
    addConnectorDataset({
      collection,
      context: 'manual',
      label: result.sourceName,
      sourceType: 'shapefile',
    })
    setLastUploadResult(result)
  }

  function handleClearAllConnectorDatasets() {
    clearConnectorDatasets()
    setFocusDatasetId(null)
    setHoveredFeatureId(null)
    setSelection(null)
    setEnvironmentalProbeCoordinates(null)
  }

  function handleDatasetChange(event: ChangeEvent<HTMLSelectElement>) {
    onDatasetChange(event.target.value)
  }

  function handleScenarioChange(event: ChangeEvent<HTMLSelectElement>) {
    onScenarioChange(event.target.value as MapViewScenario)
  }

  function handleBoundingBoxComplete(bbox: MapBoundingBox) {
    setBboxSearchError(null)
    bboxSearchMutation.mutate({
      bbox,
      includeGbif: includeGbifInAreaQuery,
      includeMacrostrat: includeMacrostratInAreaQuery,
    })
  }

  return (
    <main className="map-view-page">
      <TerraHeader activeDataset={dataset} />

      <MapCanvas
        connectorDatasets={connectorDatasets}
        environmentalLayers={environmentalLayers}
        focusDatasetId={focusDatasetId}
        features={features}
        layers={layers}
        onFocusHandled={() => setFocusDatasetId(null)}
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
        loadingLabel={areaQueryLoadingLabel}
        onDismissError={() => setBboxSearchError(null)}
      />

      {connectorDatasets.length > 0 ? (
        <aside className="map-view-page__legend">
          <ConnectorLegendPanel
            datasets={connectorDatasets}
            onClearAll={handleClearAllConnectorDatasets}
            onRemoveDataset={(datasetId) => {
              removeConnectorDataset(datasetId)
              if (hoveredFeatureId?.startsWith(datasetId)) {
                setHoveredFeatureId(null)
              }
              if (selection?.featureId?.startsWith(datasetId)) {
                setSelection(null)
              }
            }}
            onSetDatasetVisibility={setDatasetVisibility}
            onZoomToDataset={(datasetId) => setFocusDatasetId(datasetId)}
          />
        </aside>
      ) : null}

      {bboxOccurrenceDatasets.length > 0 ? (
        <aside className="map-view-page__results">
          <ConnectorResultsPanel datasets={bboxOccurrenceDatasets} />
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

                <AreaQuerySourcesPanel
                  includeGbif={includeGbifInAreaQuery}
                  includeMacrostrat={includeMacrostratInAreaQuery}
                  onToggleGbif={() =>
                    setIncludeGbifInAreaQuery((currentValue) => !currentValue)
                  }
                  onToggleMacrostrat={() =>
                    setIncludeMacrostratInAreaQuery((currentValue) => !currentValue)
                  }
                />

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
            <div className="map-view-page__layer-panel-stack">
              <LayerControlPanel
                activeDataset={dataset}
                layers={layers}
              />
              <EnvironmentalLayersPanel
                layers={environmentalLayers}
                onRemoveLayer={(layerId) => {
                  removeEnvironmentalLayer(layerId)

                  if (
                    environmentalLayers.filter((layer) => layer.id !== layerId).length === 0
                  ) {
                    setEnvironmentalProbeCoordinates(null)
                  }
                }}
                onSetLayerOpacity={setEnvironmentalLayerOpacity}
                onSetLayerVisibility={setEnvironmentalLayerVisibility}
              />
            </div>
          )}
        </aside>
      ) : null}

      {selectedFeature || environmentalLayers.length > 0 ? (
        <aside className="map-view-page__inspector">
          {selectedFeature ? <FeatureInspectorPanel feature={selectedFeature} /> : null}
          <EnvironmentalContextPanel layers={environmentalLayers} />
          <EnvironmentalPointSamplePanel
            coordinates={environmentalProbeCoordinates}
            errorMessage={
              soilGridsPointSampleQuery.error instanceof Error
                ? soilGridsPointSampleQuery.error.message
                : null
            }
            isLoading={soilGridsPointSampleQuery.isLoading}
            samples={soilGridsPointSampleQuery.data ?? []}
          />
          <div className="map-view-page__inspector-summary">
            <div className="map-view-page__session-metric">
              <span>Visible features</span>
              <strong>{visibleFeatureCount}</strong>
            </div>
            <div className="map-view-page__session-metric">
              <span>Environmental layers</span>
              <strong>{visibleEnvironmentalLayers.length}</strong>
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
        credit="Developed by Gabriel Adornes"
        githubUrl="https://github.com/Gkuran"
        hoverTarget={hoverTargetLabel}
        linkedinUrl="https://www.linkedin.com/in/gabriel-adornes-58a86b218"
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
          setBboxSearchError(null)
          addConnectorDataset({
            collection,
            context: 'manual',
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
        onAddEnvironmentalLayer={(layer) => {
          addEnvironmentalLayer(layer)
          setActivePanel('layers')
          setIsConnectorsModalOpen(false)
        }}
        onImportCsv={({ collection, sourceName }) => {
          setBboxSearchError(null)
          addConnectorDataset({
            collection,
            context: 'manual',
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
