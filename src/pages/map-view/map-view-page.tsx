import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { FeatureCollection, Geometry } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { ConnectorLegendPanel } from '@/features/connectors/components/connector-legend-panel'
import { ConnectorResultsPanel } from '@/features/connectors/components/connector-results-panel'
import { ConnectorsModal } from '@/features/connectors/components/connectors-modal'
import { AreaQuerySettingsModal } from '@/features/connectors/components/area-query-settings-modal'
import { buildVisibleSessionFeatures } from '@/features/map/lib/build-visible-session-features'
import { searchAreaDataByBbox } from '@/features/connectors/bbox/lib/search-area-data-by-bbox'
import {
  buildGbifOccurrenceSummary,
  defaultGbifOccurrenceFilters,
  filterConnectorDatasetsByGbifFilters,
} from '@/features/connectors/lib/gbif-occurrence-filters'
import { buildEnrichedOccurrencesExport } from '@/features/export/lib/build-enriched-occurrences-export'
import { buildBgsrSessionExport } from '@/features/export/lib/build-bgsr-session-export'
import { ExportSessionModal } from '@/features/export/components/export-session-modal'
import type { BgsrSessionImport } from '@/features/export/lib/bgsr-session-schema'
import { downloadExportFile } from '@/features/export/lib/download-export-file'
import { OnboardingTour } from '@/features/onboarding/components/onboarding-tour'
import { buildBgsrTourSteps } from '@/features/onboarding/lib/build-bgsr-tour-steps'
import { useOnboardingStore } from '@/features/onboarding/stores/use-onboarding-store'
import {
  extractGbifOccurrenceKey,
  requestGbifOccurrenceDetail,
} from '@/features/connectors/gbif/api/request-gbif-occurrence-detail'
import { useConnectorDatasetsStore } from '@/features/connectors/stores/use-connector-datasets-store'
import { requestSoilGridsBatchPointSample } from '@/features/environmental-layers/api/request-soilgrids-batch-point-sample'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { EnvironmentalContextPanel } from '@/features/environmental-layers/components/environmental-context-panel'
import { EnvironmentalLayersPanel } from '@/features/environmental-layers/components/environmental-layers-panel'
import { EnvironmentalPointSamplePanel } from '@/features/environmental-layers/components/environmental-point-sample-panel'
import { requestSoilGridsPointSample } from '@/features/environmental-layers/api/request-soilgrids-point-sample'
import { mapEnvironmentalLayersToSoilGridsRequest } from '@/features/environmental-layers/lib/map-environmental-layers-to-soilgrids-request'
import { useEnvironmentalLayersStore } from '@/features/environmental-layers/stores/use-environmental-layers-store'
import { FeatureInspectorPanel } from '@/features/feature-inspector/components/feature-inspector-panel'
import { getFeatureFocusCoordinates } from '@/features/feature-inspector/lib/feature-inspector-geometry'
import { getInspectorNavigationContext } from '@/features/feature-inspector/lib/get-inspector-navigation-context'
import { MapCanvas } from '@/features/map/components/map-canvas'
import { MapToolbar } from '@/features/map/components/map-toolbar'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
import type { MapBoundingBox } from '@/features/map/types/map-bounding-box'
import { useLayerPresentationStore } from '@/features/layers/stores/use-layer-presentation-store'
import { UploadShapefileModal } from '@/features/shapefile-upload/components/upload-shapefile-modal'
import { createUploadResult } from '@/features/shapefile-upload/lib/create-upload-result'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'
import { QueryFeedbackBanner } from '@/shared/ui/query-feedback-banner/query-feedback-banner'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TerraFooter } from '@/shared/ui/terra-footer/terra-footer'
import { TerraHeader } from '@/shared/ui/terra-header/terra-header'

import './map-view-page.css'

interface MapViewPageProps {
  dataset: DatasetMetadata
  features: FeatureCollection<Geometry, FeatureProperties>
  layers: LayerMetadata[]
  uploadHistory: UploadResult[]
}

function buildBboxQueryParams(bbox: MapBoundingBox): Record<string, string> {
  return {
    minLng: bbox.minLng.toFixed(6),
    minLat: bbox.minLat.toFixed(6),
    maxLng: bbox.maxLng.toFixed(6),
    maxLat: bbox.maxLat.toFixed(6),
  }
}

export function MapViewPage({
  dataset,
  features,
  layers,
  uploadHistory,
}: MapViewPageProps) {
  const selection = useMapUiStore((state) => state.selection)
  const setActiveTool = useMapUiStore((state) => state.setActiveTool)
  const environmentalProbeCoordinates = useMapUiStore(
    (state) => state.environmentalProbeCoordinates,
  )
  const hoveredFeatureId = useMapUiStore((state) => state.hoveredFeatureId)
  const setHoveredFeatureId = useMapUiStore((state) => state.setHoveredFeatureId)
  const setFocusCoordinates = useMapUiStore((state) => state.setFocusCoordinates)
  const setEnvironmentalProbeCoordinates = useMapUiStore(
    (state) => state.setEnvironmentalProbeCoordinates,
  )
  const setSelection = useMapUiStore((state) => state.setSelection)
  const activeTool = useMapUiStore((state) => state.activeTool)
  const focusCoordinates = useMapUiStore((state) => state.focusCoordinates)
  const connectorDatasets = useConnectorDatasetsStore((state) => state.datasets)
  const recentQueries = useConnectorDatasetsStore((state) => state.recentQueries)
  const addConnectorDataset = useConnectorDatasetsStore((state) => state.addDataset)
  const clearConnectorDatasets = useConnectorDatasetsStore((state) => state.clearDatasets)
  const removeConnectorDataset = useConnectorDatasetsStore((state) => state.removeDataset)
  const replaceConnectorDatasets = useConnectorDatasetsStore((state) => state.replaceDatasets)
  const replaceRecentQueries = useConnectorDatasetsStore((state) => state.replaceRecentQueries)
  const setDatasetVisibility = useConnectorDatasetsStore(
    (state) => state.setDatasetVisibility,
  )
  const environmentalLayers = useEnvironmentalLayersStore((state) => state.layers)
  const addEnvironmentalLayer = useEnvironmentalLayersStore((state) => state.addLayer)
  const removeEnvironmentalLayer = useEnvironmentalLayersStore(
    (state) => state.removeLayer,
  )
  const replaceEnvironmentalLayers = useEnvironmentalLayersStore(
    (state) => state.replaceLayers,
  )
  const setEnvironmentalLayerOpacity = useEnvironmentalLayersStore(
    (state) => state.setLayerOpacity,
  )
  const setEnvironmentalLayerVisibility = useEnvironmentalLayersStore(
    (state) => state.setLayerVisibility,
  )
  const layerVisibilityById = useLayerPresentationStore((state) => state.visibilityById)
  const layerOpacityById = useLayerPresentationStore((state) => state.opacityById)
  const replaceLayerPresentation = useLayerPresentationStore(
    (state) => state.replacePresentation,
  )
  const currentTourStepIndex = useOnboardingStore((state) => state.currentStepIndex)
  const closeTour = useOnboardingStore((state) => state.closeTour)
  const completeTour = useOnboardingStore((state) => state.completeTour)
  const goToNextTourStep = useOnboardingStore((state) => state.goToNextStep)
  const goToPreviousTourStep = useOnboardingStore((state) => state.goToPreviousStep)
  const isTourOpen = useOnboardingStore((state) => state.isOpen)
  const startTour = useOnboardingStore((state) => state.startTour)
  const [sessionDataset, setSessionDataset] = useState(dataset)
  const [sessionFeatures, setSessionFeatures] = useState(features)
  const [sessionLayers, setSessionLayers] = useState(layers)
  const [sessionUploadHistory, setSessionUploadHistory] = useState(uploadHistory)
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null)
  const [bboxSearchError, setBboxSearchError] = useState<string | null>(null)
  const [focusDatasetId, setFocusDatasetId] = useState<string | null>(null)
  const [focusFeatureCollection, setFocusFeatureCollection] = useState<
    FeatureCollection<Geometry, FeatureProperties> | null
  >(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false)
  const [isAreaQuerySettingsOpen, setIsAreaQuerySettingsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'layers' | null>(null)
  const [includeGbifInAreaQuery, setIncludeGbifInAreaQuery] = useState(true)
  const [includeMacrostratInAreaQuery, setIncludeMacrostratInAreaQuery] = useState(true)
  const [gbifOccurrenceFilters, setGbifOccurrenceFilters] = useState(
    defaultGbifOccurrenceFilters,
  )
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(true)
  const rightSidebarRef = useRef<HTMLElement | null>(null)
  const visibleEnvironmentalLayers = useMemo(
    () => environmentalLayers.filter((layer) => layer.isVisible),
    [environmentalLayers],
  )

  useEffect(() => {
    setSessionDataset(dataset)
  }, [dataset])

  useEffect(() => {
    setSessionFeatures(features)
  }, [features])

  useEffect(() => {
    setSessionLayers(layers)
  }, [layers])

  useEffect(() => {
    setSessionUploadHistory(uploadHistory)
  }, [uploadHistory])

  const bboxSearchMutation = useMutation({
    mutationFn: searchAreaDataByBbox,
    onMutate: () => {
      setBboxSearchError(null)
      setActiveTool('inspect')
    },
    onSuccess: ({ gbif, macrostrat, warnings }, variables) => {
      if (gbif) {
        addConnectorDataset({
          collection: gbif.featureCollection,
          context: 'bbox',
          label: gbif.queryLabel,
          provenance: {
            provider: 'GBIF',
            sourceName: 'Area query',
            queryLabel: gbif.queryLabel,
            queryParams: {
              ...buildBboxQueryParams(variables.bbox),
              limit: String(gbif.resultCount),
            },
            notes: ['Imported from a GBIF bounding box query.'],
          },
          sourceType: 'gbif',
        })
      }

      if (macrostrat) {
        addConnectorDataset({
          collection: macrostrat.featureCollection,
          context: 'bbox',
          label: 'Macrostrat geology',
          provenance: {
            provider: 'Macrostrat',
            sourceName: 'Area query',
            queryLabel: macrostrat.queryLabel,
            queryParams: {
              ...buildBboxQueryParams(variables.bbox),
              limit: String(macrostrat.resultCount),
            },
            notes: ['Imported from a Macrostrat bounding box query.'],
          },
          sourceType: 'macrostrat',
        })
      }

      setLastUploadResult(
        createUploadResult({
          featureCount: (gbif?.resultCount ?? 0) + (macrostrat?.resultCount ?? 0),
          idPrefix: 'bbox',
          message:
            warnings.length > 0
              ? `Area query completed with warnings: ${warnings.join(' | ')}`
              : gbif && macrostrat
                ? 'Fauna, flora, and Macrostrat geology were fetched from the selected area.'
                : gbif
                  ? 'Fauna and flora occurrences were fetched from the selected area.'
                  : 'Macrostrat geologic units were fetched from the selected area.',
          sourceName: 'Area query',
          status: 'success',
        }),
      )
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
        layers: mapEnvironmentalLayersToSoilGridsRequest(visibleEnvironmentalLayers),
      }),
  })
  const filteredConnectorDatasets = useMemo(
    () => filterConnectorDatasetsByGbifFilters(connectorDatasets, gbifOccurrenceFilters),
    [connectorDatasets, gbifOccurrenceFilters],
  )
  const visibleSessionFeatures = useMemo(
    () => buildVisibleSessionFeatures(sessionFeatures, filteredConnectorDatasets),
    [sessionFeatures, filteredConnectorDatasets],
  )
  const selectedFeature = useMemo(
    () =>
      visibleSessionFeatures.find(
        (feature) => feature.properties.id === selection?.featureId,
      ) ?? null,
    [selection?.featureId, visibleSessionFeatures],
  )
  const selectedConnectorDataset = useMemo(
    () =>
      selectedFeature
        ? connectorDatasets.find(
            (connectorDataset) =>
              connectorDataset.id === selectedFeature.properties.datasetId,
          ) ?? null
        : null,
    [connectorDatasets, selectedFeature],
  )
  const hoveredFeature = useMemo(
    () =>
      hoveredFeatureId
        ? visibleSessionFeatures.find(
            (feature) => feature.properties.id === hoveredFeatureId,
          ) ?? null
        : null,
    [hoveredFeatureId, visibleSessionFeatures],
  )
  const selectedNavigationContext = useMemo(
    () =>
      getInspectorNavigationContext({
        baseFeatures: sessionFeatures,
        connectorDatasets,
        selectedFeature,
      }),
    [connectorDatasets, sessionFeatures, selectedFeature],
  )
  const selectedGbifOccurrenceKey = useMemo(() => {
    if (!selectedFeature?.properties?.id) {
      return null
    }

    return extractGbifOccurrenceKey(
      selectedFeature.properties.id,
      selectedFeature.properties.rawAttributes,
    )
  }, [selectedFeature])
  const hoverTargetLabel =
    hoveredFeature?.properties.scientificName ??
    hoveredFeature?.properties.title ??
    hoveredFeatureId ??
    'No hover target'
  const visibleFeatureCount = visibleSessionFeatures.length
  const bboxDatasets = filteredConnectorDatasets.filter((dataset) => dataset.context === 'bbox')
  const bboxOccurrenceDatasets = bboxDatasets.filter(
    (dataset) => dataset.sourceType === 'gbif',
  )
  const hasRawBboxOccurrenceDatasets = connectorDatasets.some(
    (dataset) => dataset.context === 'bbox' && dataset.sourceType === 'gbif',
  )
  const tourSteps = useMemo(
    () =>
      buildBgsrTourSteps({
        hasConnectorLayers: connectorDatasets.length > 0,
        hasInspector:
          selectedFeature !== null ||
          environmentalLayers.length > 0 ||
          hasRawBboxOccurrenceDatasets,
        hasQueryResults: hasRawBboxOccurrenceDatasets,
      }),
    [
      connectorDatasets.length,
      environmentalLayers.length,
      hasRawBboxOccurrenceDatasets,
      selectedFeature,
    ],
  )
  const currentTourStep = tourSteps[currentTourStepIndex] ?? null
  useEffect(() => {
    if (!isTourOpen || !currentTourStep) {
      return
    }

    if (currentTourStep.action === 'open-connectors') {
      setIsAreaQuerySettingsOpen(false)
      setIsConnectorsModalOpen(true)
    }

    if (currentTourStep.action === 'open-settings') {
      setIsConnectorsModalOpen(false)
      setIsAreaQuerySettingsOpen(true)
    }

    if (currentTourStep.action === 'open-layers') {
      setActivePanel('layers')
      setIsConnectorsModalOpen(false)
      setIsAreaQuerySettingsOpen(false)
    }
  }, [currentTourStep, isTourOpen])
  const gbifOccurrenceSummary = useMemo(
    () => buildGbifOccurrenceSummary(connectorDatasets, gbifOccurrenceFilters),
    [connectorDatasets, gbifOccurrenceFilters],
  )
  const availableBasisOfRecord = useMemo(
    () =>
      [...new Set(
        connectorDatasets
          .filter((dataset) => dataset.sourceType === 'gbif')
          .flatMap((dataset) =>
            dataset.collection.features
              .map((feature) => feature.properties.rawAttributes?.basisOfRecord?.trim() ?? '')
              .filter((value) => value !== ''),
          ),
      )].sort((left, right) => left.localeCompare(right)),
    [connectorDatasets],
  )
  const availableCountries = useMemo(
    () =>
      [...new Set(
        connectorDatasets
          .filter((dataset) => dataset.sourceType === 'gbif')
          .flatMap((dataset) =>
            dataset.collection.features
              .map((feature) => feature.properties.rawAttributes?.country?.trim() ?? '')
              .filter((value) => value !== ''),
          ),
      )].sort((left, right) => left.localeCompare(right)),
    [connectorDatasets],
  )
  const availableStates = useMemo(
    () =>
      [...new Set(
        connectorDatasets
          .filter((dataset) => dataset.sourceType === 'gbif')
          .flatMap((dataset) =>
            dataset.collection.features
              .map((feature) => feature.properties.rawAttributes?.stateProvince?.trim() ?? '')
              .filter((value) => value !== ''),
          ),
      )].sort((left, right) => left.localeCompare(right)),
    [connectorDatasets],
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
  const exportMutation = useMutation({
    mutationFn: async () => {
      const visibleGbifDatasets = filteredConnectorDatasets.filter(
        (dataset) => dataset.sourceType === 'gbif' && dataset.isVisible,
      )
      const visibleMacrostratDatasets = filteredConnectorDatasets.filter(
        (dataset) => dataset.sourceType === 'macrostrat' && dataset.isVisible,
      )

      if (visibleGbifDatasets.length === 0) {
        throw new Error('No visible GBIF occurrences are available for export.')
      }

      const visibleOccurrencePoints = visibleGbifDatasets.flatMap((dataset) =>
        dataset.collection.features
          .filter(
            (feature): feature is typeof feature & {
              geometry: { type: 'Point'; coordinates: [number, number] }
            } => feature.geometry.type === 'Point',
          )
          .map((feature) => ({
            id: feature.properties.id,
            lon: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          })),
      )

      const soilSampleItems =
        visibleEnvironmentalLayers.length > 0 && visibleOccurrencePoints.length > 0
          ? await requestSoilGridsBatchPointSample({
              points: visibleOccurrencePoints,
              layers: mapEnvironmentalLayersToSoilGridsRequest(visibleEnvironmentalLayers),
            })
          : []

      const exportPayload = buildEnrichedOccurrencesExport({
        activeEnvironmentalLayers: visibleEnvironmentalLayers.map((layer) => ({
          id: layer.id,
          label: layer.label,
          propertyId: layer.propertyId,
          depthId: layer.depthId,
          statisticId: layer.statisticId,
          opacity: `${layer.opacity}`,
          isVisible: `${layer.isVisible}`,
        })),
        activeFilters: {
          includeFlora: gbifOccurrenceFilters.includeFlora,
          includeFauna: gbifOccurrenceFilters.includeFauna,
          requireImage: gbifOccurrenceFilters.requireImage,
          basisOfRecord: gbifOccurrenceFilters.basisOfRecord,
          country: gbifOccurrenceFilters.country,
          stateProvince: gbifOccurrenceFilters.stateProvince,
          yearFrom: gbifOccurrenceFilters.yearFrom,
          yearTo: gbifOccurrenceFilters.yearTo,
        },
        gbifDatasets: visibleGbifDatasets,
        macrostratDatasets: visibleMacrostratDatasets,
        soilSampleItems,
      })

      if (exportPayload.rowCount === 0) {
        throw new Error('No visible occurrence rows are available for export.')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      downloadExportFile(
        exportPayload.csv,
        `bgsr-enriched-occurrences-${timestamp}.csv`,
        'text/csv;charset=utf-8',
      )

      return exportPayload.rowCount
    },
    onError: (error) => {
      setBboxSearchError(error.message)
    },
  })
  const canExportCsv = filteredConnectorDatasets.some(
    (dataset) => dataset.sourceType === 'gbif' && dataset.isVisible,
  )
  const canExportSession =
    connectorDatasets.length > 0 ||
    environmentalLayers.length > 0 ||
    sessionFeatures.features.length > 0

  function handleImportSession(fileName: string, session: BgsrSessionImport) {
    const baseLayerVisibilityById = Object.fromEntries(
      session.layers.base.map((layer) => [layer.id, layer.isVisible]),
    )
    const baseLayerOpacityById = Object.fromEntries(
      session.layers.base.map((layer) => [layer.id, layer.opacity]),
    )

    setBboxSearchError(null)
    setFocusDatasetId(null)
    setFocusFeatureCollection(null)
    setSessionDataset(session.dataset)
    setSessionFeatures(session.sessionData.baseFeatures)
    setSessionLayers(
      session.layers.base.map(({ isVisible, opacity, ...layer }) => layer),
    )
    setSessionUploadHistory(session.sessionData.uploadHistory)
    replaceConnectorDatasets(session.sessionData.connectorDatasets)
    replaceRecentQueries(session.sessionData.recentQueries)
    replaceEnvironmentalLayers(session.layers.environmental)
    replaceLayerPresentation({
      opacityById: baseLayerOpacityById,
      visibilityById: baseLayerVisibilityById,
    })
    setActivePanel(session.map.activePanel)
    setActiveTool(session.map.activeTool)
    setSelection(session.map.selection)
    setHoveredFeatureId(session.map.hoveredFeatureId)
    setEnvironmentalProbeCoordinates(session.map.environmentalProbeCoordinates)
    setIncludeGbifInAreaQuery(session.areaQuery.includeGbif)
    setIncludeMacrostratInAreaQuery(session.areaQuery.includeMacrostrat)
    setIsResultsCollapsed(session.areaQuery.isResultsCollapsed)
    setGbifOccurrenceFilters(session.areaQuery.gbifFilters)
    setLastUploadResult(
      createUploadResult({
        featureCount:
          session.sessionData.baseFeatures.features.length +
          session.sessionData.connectorDatasets.reduce(
            (total, dataset) => total + dataset.collection.features.length,
            0,
          ),
        idPrefix: 'bgsr-session',
        message: 'BGSR session state was restored from file.',
        sourceName: fileName,
        status: 'success',
      }),
    )

    if (session.map.selection) {
      setFocusCoordinates(session.map.selection.coordinates)
    } else {
      setFocusCoordinates(null)
    }
  }

  function handleExportSession() {
    const sessionPayload = buildBgsrSessionExport({
      activePanel,
      activeTool,
      connectorDatasets,
      dataset: sessionDataset,
      environmentalLayers,
      environmentalProbeCoordinates,
      features: sessionFeatures,
      gbifOccurrenceFilters,
      hoveredFeatureId,
      includeGbifInAreaQuery,
      includeMacrostratInAreaQuery,
      isResultsCollapsed,
      layerOpacityById,
      layerVisibilityById,
      layers: sessionLayers,
      recentQueries,
      selection,
      uploadHistory: sessionUploadHistory,
      visibleFeatureCount,
    })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    downloadExportFile(
      JSON.stringify(sessionPayload, null, 2),
      `bgsr-session-${timestamp}.bgsr.json`,
      'application/json;charset=utf-8',
    )
    setIsExportModalOpen(false)
  }
  const gbifOccurrenceDetailQuery = useQuery({
    enabled: selectedGbifOccurrenceKey !== null,
    queryKey: ['gbif-occurrence-detail', selectedGbifOccurrenceKey ?? 'none'],
    queryFn: () => requestGbifOccurrenceDetail(selectedGbifOccurrenceKey ?? 0),
  })

  useEffect(() => {
    if (!selectedFeature || !rightSidebarRef.current) {
      return
    }

    rightSidebarRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [selectedFeature])

  function handleUploadComplete(
    collection: FeatureCollection<Geometry, FeatureProperties>,
    result: UploadResult,
  ) {
    addConnectorDataset({
      collection,
      context: 'manual',
      label: result.sourceName,
      provenance: {
        provider: 'Shapefile',
        sourceName: result.sourceName,
        importedAt: result.importedAt,
        recordCount: result.featureCount,
        queryParams: {
          fileName: result.sourceName,
        },
        notes: [result.message],
      },
      sourceType: 'shapefile',
    })
    setLastUploadResult(result)
    setSessionUploadHistory((currentHistory) => [result, ...currentHistory])
  }

  function handleClearAllConnectorDatasets() {
    clearConnectorDatasets()
    setFocusDatasetId(null)
    setHoveredFeatureId(null)
    setSelection(null)
    setEnvironmentalProbeCoordinates(null)
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
      <TerraHeader
        isExportDisabled={!canExportSession}
        isExporting={exportMutation.isPending}
        onOpenConnectors={() => setIsConnectorsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsAreaQuerySettingsOpen(true)}
        onOpenTour={startTour}
      />

      <MapCanvas
        connectorDatasets={filteredConnectorDatasets}
        environmentalLayers={environmentalLayers}
        focusDatasetId={focusDatasetId}
        focusFeatureCollection={focusFeatureCollection}
        layers={sessionLayers}
        features={sessionFeatures}
        onFocusHandled={() => setFocusDatasetId(null)}
        onFocusFeatureCollectionHandled={() => setFocusFeatureCollection(null)}
        onBoundingBoxComplete={handleBoundingBoxComplete}
      />

      <div className="map-view-page__dock">
        <MapToolbar
          activePanel={activePanel}
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

      {activePanel ? (
        <aside className="map-view-page__panel">
          {activePanel === 'layers' ? (
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
          ) : null}
        </aside>
      ) : null}

      {selectedFeature || hasRawBboxOccurrenceDatasets || environmentalLayers.length > 0 ? (
        <aside className="map-view-page__inspector" ref={rightSidebarRef}>
          {selectedFeature ? (
            <FeatureInspectorPanel
              baseDataset={sessionDataset}
              connectorProvenance={selectedConnectorDataset?.provenance ?? null}
              feature={selectedFeature}
              gbifDetail={gbifOccurrenceDetailQuery.data ?? null}
              gbifDetailError={
                gbifOccurrenceDetailQuery.error instanceof Error
                  ? gbifOccurrenceDetailQuery.error.message
                  : null
              }
              isGbifDetailLoading={gbifOccurrenceDetailQuery.isLoading}
              navigation={
                selectedNavigationContext
                  ? {
                      currentIndex: selectedNavigationContext.currentIndex,
                      total: selectedNavigationContext.total,
                      onPrevious: () => {
                        const previousIndex =
                          (selectedNavigationContext.currentIndex -
                            1 +
                            selectedNavigationContext.total) %
                          selectedNavigationContext.total
                        const previousFeature =
                          selectedNavigationContext.features[previousIndex]
                        const coordinates = getFeatureFocusCoordinates(previousFeature)

                        setSelection({
                          featureId: previousFeature.properties.id,
                          layerId:
                            selection?.layerId ??
                            previousFeature.properties.datasetId,
                          coordinates: coordinates ?? selection?.coordinates ?? [0, 0],
                        })

                        if (coordinates) {
                          setFocusCoordinates(coordinates)
                        }
                      },
                      onNext: () => {
                        const nextIndex =
                          (selectedNavigationContext.currentIndex + 1) %
                          selectedNavigationContext.total
                        const nextFeature = selectedNavigationContext.features[nextIndex]
                        const coordinates = getFeatureFocusCoordinates(nextFeature)

                        setSelection({
                          featureId: nextFeature.properties.id,
                          layerId:
                            selection?.layerId ??
                            nextFeature.properties.datasetId,
                          coordinates: coordinates ?? selection?.coordinates ?? [0, 0],
                        })

                        if (coordinates) {
                          setFocusCoordinates(coordinates)
                        }
                      },
                    }
                  : null
              }
              onCenterFeature={() => {
                const coordinates = getFeatureFocusCoordinates(selectedFeature)

                if (coordinates) {
                  setFocusCoordinates(coordinates)
                }
              }}
            />
          ) : null}
          {hasRawBboxOccurrenceDatasets ? (
            <ConnectorResultsPanel
              availableBasisOfRecord={availableBasisOfRecord}
              availableCountries={availableCountries}
              availableStates={availableStates}
              datasets={bboxOccurrenceDatasets}
              filters={gbifOccurrenceFilters}
              isCollapsed={isResultsCollapsed}
              onFiltersChange={setGbifOccurrenceFilters}
              onFitToFilteredResults={() =>
                setFocusFeatureCollection({
                  type: 'FeatureCollection',
                  features: bboxOccurrenceDatasets.flatMap(
                    (dataset) => dataset.collection.features,
                  ),
                })
              }
              onToggleCollapse={() => setIsResultsCollapsed((currentValue) => !currentValue)}
              summary={gbifOccurrenceSummary}
            />
          ) : null}
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
                label={sessionDataset.status}
                tone={sessionDataset.status === 'processing' ? 'processing' : 'ready'}
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
        uploadHistory={sessionUploadHistory}
      />

      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
        onConnectGbif={({ collection, provenance, sourceName }) => {
          setBboxSearchError(null)
          addConnectorDataset({
            collection,
            context: 'manual',
            label: sourceName,
            provenance,
            sourceType: 'gbif',
          })
          setLastUploadResult(
            createUploadResult({
              featureCount: collection.features.length,
              idPrefix: 'gbif',
              message: 'Occurrences were fetched live from GBIF.',
              sourceName,
              status: 'success',
            }),
          )
          setIsConnectorsModalOpen(false)
        }}
        onAddEnvironmentalLayer={(layer) => {
          addEnvironmentalLayer(layer)
          setActivePanel('layers')
          setIsConnectorsModalOpen(false)
        }}
        onImportCsv={({ collection, provenance, sourceName }) => {
          setBboxSearchError(null)
          addConnectorDataset({
            collection,
            context: 'manual',
            label: sourceName,
            provenance,
            sourceType: 'csv',
          })
          setLastUploadResult(
            createUploadResult({
              featureCount: collection.features.length,
              idPrefix: 'csv',
              message: 'Scientific records were imported from CSV.',
              sourceName,
              status: 'success',
            }),
          )
          setIsConnectorsModalOpen(false)
        }}
        onImportSession={({ fileName, session }) => {
          handleImportSession(fileName, session)
          setIsConnectorsModalOpen(false)
        }}
        onOpenShapefileImport={() => {
          setIsConnectorsModalOpen(false)
          setIsUploadModalOpen(true)
        }}
      />

      <AreaQuerySettingsModal
        includeGbif={includeGbifInAreaQuery}
        includeMacrostrat={includeMacrostratInAreaQuery}
        isOpen={isAreaQuerySettingsOpen}
        onClose={() => setIsAreaQuerySettingsOpen(false)}
        onToggleGbif={() => setIncludeGbifInAreaQuery((currentValue) => !currentValue)}
        onToggleMacrostrat={() =>
          setIncludeMacrostratInAreaQuery((currentValue) => !currentValue)
        }
      />

      <ExportSessionModal
        canExportCsv={canExportCsv}
        canExportSession={canExportSession}
        isCsvExporting={exportMutation.isPending}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportCsv={() => {
          setBboxSearchError(null)
          exportMutation.mutate()
          setIsExportModalOpen(false)
        }}
        onExportSession={handleExportSession}
      />

      <OnboardingTour
        currentStepIndex={currentTourStepIndex}
        isOpen={isTourOpen}
        onClose={closeTour}
        onNext={() => {
          if (currentTourStepIndex >= tourSteps.length - 1) {
            completeTour()
            setIsConnectorsModalOpen(false)
            setIsAreaQuerySettingsOpen(false)
            return
          }

          goToNextTourStep(tourSteps.length)
        }}
        onPrevious={goToPreviousTourStep}
        steps={tourSteps}
      />
    </main>
  )
}
