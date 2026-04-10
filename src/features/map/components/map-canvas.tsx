import { useEffect, useMemo, useRef, useState } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Position,
} from 'geojson'
import Map, {
  Layer,
  type MapLayerMouseEvent,
  type MapRef,
  NavigationControl,
  type MapMouseEvent,
  type MapStyleDataEvent,
  Popup,
  Source,
  type StyleSpecification,
} from 'react-map-gl/maplibre'

import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import { useLayerPresentationStore } from '@/features/layers/stores/use-layer-presentation-store'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
import type { MapBoundingBox } from '@/features/map/types/map-bounding-box'
import { env } from '@/shared/config/env'
import './map-canvas.css'

const baseMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster',
      type: 'raster',
      source: 'osm-raster',
    },
  ],
}

const analysisMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    'carto-light-nolabels': {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO',
    },
    'carto-light-labels': {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'carto-light-nolabels',
      type: 'raster',
      source: 'carto-light-nolabels',
    },
    {
      id: 'carto-light-labels',
      type: 'raster',
      source: 'carto-light-labels',
      paint: {
        'raster-opacity': 0.92,
      },
    },
  ],
}

const initialViewState = {
  longitude: -51.15,
  latitude: -29.92,
  zoom: 7.2,
}

const floraIconId = 'terra-flora-marker'
const faunaIconId = 'terra-fauna-marker'
const gbifClusterThreshold = 90
const gbifClusterMaxZoom = 6
const gbifClusterRadius = 22

const floraIconMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="11.4" fill="rgba(255,255,255,0.94)" stroke="rgba(18,31,26,0.12)" stroke-width="1.2"/>
  <path d="M14 22c-.8 0-1.4-.6-1.4-1.4v-3.4c0-2.3 1.1-4.3 2.9-5.5-3.7.3-6.6-1.4-8.4-5C9.7 4.5 12.5 3.9 15.3 4.7c1.9.6 3.3 1.8 4.1 3.7 2-1.6 4-1.7 6.1-.3-.9 4.8-3.7 7.4-8.3 7.7-2 .2-3.2 1.3-3.2 3.2v1.6c0 .8-.6 1.4-1.4 1.4Z" fill="#4f7d4c"/>
  <path d="M14 18.5c-.2 0-.4-.1-.6-.2a.95.95 0 0 1-.1-1.3l5.4-6.1c.3-.4.9-.4 1.3-.1.4.3.4.9.1 1.3l-5.4 6.1c-.2.2-.4.3-.7.3Z" fill="#eff7e9"/>
</svg>
`

const faunaIconMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="11.4" fill="rgba(255,255,255,0.94)" stroke="rgba(18,31,26,0.12)" stroke-width="1.2"/>
  <circle cx="9.1" cy="9.1" r="2.4" fill="#8a5a36"/>
  <circle cx="18.9" cy="9.1" r="2.4" fill="#8a5a36"/>
  <circle cx="6.9" cy="14" r="1.95" fill="#8a5a36"/>
  <circle cx="21.1" cy="14" r="1.95" fill="#8a5a36"/>
  <path d="M14 21.6c3.4 0 6.1-2.1 6.1-4.9 0-3-2.7-5.7-6.1-5.7s-6.1 2.7-6.1 5.7c0 2.8 2.7 4.9 6.1 4.9Z" fill="#8a5a36"/>
  <path d="M11.8 17.1c0 1 1 1.7 2.2 1.7s2.2-.7 2.2-1.7" fill="none" stroke="#fff7e7" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`

function buildIconDataUrl(svgMarkup: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
}

interface MapCanvasProps {
  features: FeatureCollection<Geometry, GeoJsonProperties>
  layers: LayerMetadata[]
  connectorDatasets: ConnectorDataset[]
  environmentalLayers: EnvironmentalLayer[]
  focusDatasetId: string | null
  onFocusHandled: () => void
  onBoundingBoxComplete: (bbox: MapBoundingBox) => void
}

interface BoundingBoxDraft {
  current: [number, number]
  start: [number, number]
}

function visitCoordinates(
  coordinates: Position | Position[] | Position[][] | Position[][][],
  onPosition: (position: Position) => void,
) {
  if (!Array.isArray(coordinates[0])) {
    onPosition(coordinates as Position)
    return
  }

  for (const coordinate of coordinates as Array<
    Position | Position[] | Position[][]
  >) {
    visitCoordinates(
      coordinate as Position | Position[] | Position[][] | Position[][][],
      onPosition,
    )
  }
}

function getFeatureCollectionBounds(
  collection: FeatureCollection<Geometry, GeoJsonProperties>,
) {
  let minLongitude = Infinity
  let minLatitude = Infinity
  let maxLongitude = -Infinity
  let maxLatitude = -Infinity

  function collectGeometryBounds(geometry: Geometry) {
    if (geometry.type === 'GeometryCollection') {
      for (const nestedGeometry of geometry.geometries) {
        collectGeometryBounds(nestedGeometry)
      }

      return
    }

    visitCoordinates(geometry.coordinates as never, ([longitude, latitude]) => {
      minLongitude = Math.min(minLongitude, longitude)
      minLatitude = Math.min(minLatitude, latitude)
      maxLongitude = Math.max(maxLongitude, longitude)
      maxLatitude = Math.max(maxLatitude, latitude)
    })
  }

  for (const feature of collection.features) {
    if (!feature.geometry) {
      continue
    }

    collectGeometryBounds(feature.geometry)
  }

  if (
    !Number.isFinite(minLongitude) ||
    !Number.isFinite(minLatitude) ||
    !Number.isFinite(maxLongitude) ||
    !Number.isFinite(maxLatitude)
  ) {
    return null
  }

  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ] as [[number, number], [number, number]]
}

function buildInteractiveLayerIds(layers: LayerMetadata[]) {
  return layers.flatMap((layer) => [
    `${layer.id}-fill`,
    `${layer.id}-line`,
    `${layer.id}-circle`,
  ])
}

export function MapCanvas({
  features,
  layers,
  connectorDatasets,
  environmentalLayers,
  focusDatasetId,
  onFocusHandled,
  onBoundingBoxComplete,
}: MapCanvasProps) {
  const mapRef = useRef<MapRef | null>(null)
  const visibilityById = useLayerPresentationStore((state) => state.visibilityById)
  const opacityById = useLayerPresentationStore((state) => state.opacityById)
  const activeTool = useMapUiStore((state) => state.activeTool)
  const selection = useMapUiStore((state) => state.selection)
  const setSelection = useMapUiStore((state) => state.setSelection)
  const setEnvironmentalProbeCoordinates = useMapUiStore(
    (state) => state.setEnvironmentalProbeCoordinates,
  )
  const hoveredFeatureId = useMapUiStore((state) => state.hoveredFeatureId)
  const setHoveredFeatureId = useMapUiStore((state) => state.setHoveredFeatureId)
  const [bboxDraft, setBboxDraft] = useState<BoundingBoxDraft | null>(null)
  const [areConnectorIconsReady, setAreConnectorIconsReady] = useState(false)
  const hasVisibleEnvironmentalLayers = environmentalLayers.some((layer) => layer.isVisible)

  async function ensureConnectorIconsLoaded() {
    if (!mapRef.current) {
      return
    }

    const map = mapRef.current.getMap()

    const loadIcon = async (iconId: string, svgMarkup: string) => {
      if (map.hasImage(iconId)) {
        return
      }

      const image = new Image(28, 28)
      image.src = buildIconDataUrl(svgMarkup)
      await image.decode()

      if (!map.hasImage(iconId)) {
        map.addImage(iconId, image)
      }
    }

    await Promise.all([
      loadIcon(floraIconId, floraIconMarkup),
      loadIcon(faunaIconId, faunaIconMarkup),
    ])

    setAreConnectorIconsReady(true)
  }

  function handleMapLoad() {
    void ensureConnectorIconsLoaded()
  }

  function handleMapStyleData(_event: MapStyleDataEvent) {
    if (!areConnectorIconsReady) {
      void ensureConnectorIconsLoaded()
      return
    }

    const map = mapRef.current?.getMap()
    if (!map) {
      return
    }

    if (!map.hasImage(floraIconId) || !map.hasImage(faunaIconId)) {
      setAreConnectorIconsReady(false)
      void ensureConnectorIconsLoaded()
    }
  }

  const selectedFeature = useMemo(
    () =>
      [
        ...features.features,
        ...connectorDatasets.flatMap((dataset) =>
          dataset.isVisible ? dataset.collection.features : [],
        ),
      ].find(
        (feature) =>
          'id' in (feature.properties ?? {}) &&
          feature.properties?.id === selection?.featureId,
      ) ?? null,
    [connectorDatasets, features.features, selection?.featureId],
  )

  const interactiveLayerIds = useMemo(
    () => [
      ...buildInteractiveLayerIds(layers),
      ...connectorDatasets.flatMap((dataset) =>
        dataset.isVisible
          ? [
              `${dataset.id}-fill`,
              `${dataset.id}-line`,
              ...(dataset.sourceType === 'gbif' &&
              dataset.collection.features.length >= gbifClusterThreshold
                ? [`${dataset.id}-cluster-circle`]
                : []),
              ...(dataset.sourceType === 'gbif'
                ? [`${dataset.id}-symbol`]
                : dataset.sourceType === 'macrostrat'
                  ? []
                  : [`${dataset.id}-circle`]),
            ]
          : [],
      ),
    ],
    [connectorDatasets, layers],
  )
  const orderedConnectorDatasets = useMemo(() => {
    const macrostratDatasets = connectorDatasets.filter(
      (dataset) => dataset.sourceType === 'macrostrat',
    )
    const remainingDatasets = connectorDatasets.filter(
      (dataset) => dataset.sourceType !== 'macrostrat',
    )

    return [...macrostratDatasets, ...remainingDatasets]
  }, [connectorDatasets])
  const bboxPreview = useMemo<FeatureCollection<Geometry, GeoJsonProperties> | null>(
    () => {
      if (!bboxDraft) {
        return null
      }

      const [startLng, startLat] = bboxDraft.start
      const [currentLng, currentLat] = bboxDraft.current
      const minLng = Math.min(startLng, currentLng)
      const minLat = Math.min(startLat, currentLat)
      const maxLng = Math.max(startLng, currentLng)
      const maxLat = Math.max(startLat, currentLat)

      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [minLng, minLat],
                  [maxLng, minLat],
                  [maxLng, maxLat],
                  [minLng, maxLat],
                  [minLng, minLat],
                ],
              ],
            },
            properties: {
              id: 'bbox-preview',
            },
          } satisfies Feature<Geometry, GeoJsonProperties>,
        ],
      }
    },
    [bboxDraft],
  )

  useEffect(() => {
    if (!selectedFeature && selection) {
      setSelection(null)
    }
  }, [selectedFeature, selection, setSelection])

  useEffect(() => {
    const latestDataset = connectorDatasets.at(-1)

    if (!latestDataset || latestDataset.collection.features.length === 0) {
      return
    }

    const bounds = getFeatureCollectionBounds(latestDataset.collection)

    if (!bounds || !mapRef.current) {
      return
    }

    mapRef.current.fitBounds(bounds, {
      padding: {
        top: 72,
        right: 96,
        bottom: 120,
        left: 96,
      },
      duration: 1200,
    })
  }, [connectorDatasets])

  useEffect(() => {
    if (!focusDatasetId || !mapRef.current) {
      return
    }

    const targetDataset = connectorDatasets.find(
      (dataset) => dataset.id === focusDatasetId,
    )

    if (!targetDataset) {
      onFocusHandled()
      return
    }

    const bounds = getFeatureCollectionBounds(targetDataset.collection)

    if (bounds) {
      mapRef.current.fitBounds(bounds, {
        padding: {
          top: 72,
          right: 96,
          bottom: 120,
          left: 96,
        },
        duration: 900,
      })
    }

    onFocusHandled()
  }, [connectorDatasets, focusDatasetId, onFocusHandled])

  function handleMapClick(event: MapMouseEvent) {
    if (activeTool !== 'inspect') {
      return
    }

    if (hasVisibleEnvironmentalLayers) {
      setEnvironmentalProbeCoordinates([event.lngLat.lng, event.lngLat.lat])
    }

    const [topFeature] = event.features ?? []

    if (!topFeature || !topFeature.properties) {
      setSelection(null)
      return
    }

    if (topFeature.properties.cluster === true) {
      const clusterId =
        typeof topFeature.properties.cluster_id === 'number'
          ? topFeature.properties.cluster_id
          : null

      if (clusterId !== null && typeof topFeature.source === 'string' && mapRef.current) {
        const map = mapRef.current.getMap()
        const source = map.getSource(topFeature.source)

        if (source && 'getClusterExpansionZoom' in source) {
          void (source as GeoJSONSource)
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              map.easeTo({
                center: [event.lngLat.lng, event.lngLat.lat],
                zoom,
                duration: 450,
              })
            })
        }
      }

      return
    }

    const layerId =
      typeof topFeature.layer?.id === 'string'
        ? topFeature.layer.id
        : layers[0]?.id ?? 'unknown-layer'
    const featureId =
      typeof topFeature.properties.id === 'string' ? topFeature.properties.id : null

    if (!featureId) {
      return
    }

    setSelection({
      featureId,
      layerId,
      coordinates: [event.lngLat.lng, event.lngLat.lat],
    })
  }

  function handleMapMouseMove(event: MapLayerMouseEvent) {
    if (activeTool === 'bbox' && bboxDraft) {
      setBboxDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              current: [event.lngLat.lng, event.lngLat.lat],
            }
          : null,
      )
      setHoveredFeatureId(null)
      return
    }

    const [topFeature] = event.features ?? []

    if (!topFeature || !topFeature.properties) {
      setHoveredFeatureId(null)
      return
    }

    const hoveredId =
      typeof topFeature.properties.id === 'string' ? topFeature.properties.id : null

    setHoveredFeatureId(hoveredId)
  }

  function handleMapMouseDown(event: MapMouseEvent) {
    if (activeTool !== 'bbox') {
      return
    }

    setSelection(null)
    setHoveredFeatureId(null)
      setBboxDraft({
      start: [event.lngLat.lng, event.lngLat.lat],
      current: [event.lngLat.lng, event.lngLat.lat],
    })
  }

  function handleMapMouseUp() {
    if (!bboxDraft || activeTool !== 'bbox') {
      return
    }

    const [startLng, startLat] = bboxDraft.start
    const [endLng, endLat] = bboxDraft.current
    const bbox: MapBoundingBox = {
      minLng: Math.min(startLng, endLng),
      minLat: Math.min(startLat, endLat),
      maxLng: Math.max(startLng, endLng),
      maxLat: Math.max(startLat, endLat),
    }

    setBboxDraft(null)

    if (bbox.minLng === bbox.maxLng || bbox.minLat === bbox.maxLat) {
      return
    }

    onBoundingBoxComplete(bbox)
  }

  function renderLayer(layer: LayerMetadata) {
    const isVisible = visibilityById[layer.id] ?? layer.isVisibleByDefault
    const opacity = opacityById[layer.id] ?? layer.defaultOpacity

    if (!isVisible) {
      return null
    }

    if (layer.geometryType === 'fill') {
      return (
        <Layer
          id={`${layer.id}-fill`}
          key={`${layer.id}-fill`}
          paint={{
            'fill-color': layer.color,
            'fill-opacity': opacity,
            'fill-outline-color': '#274536',
          }}
          type="fill"
        />
      )
    }

    if (layer.geometryType === 'line') {
      return (
        <Layer
          id={`${layer.id}-line`}
          key={`${layer.id}-line`}
          paint={{
            'line-color': layer.color,
            'line-opacity': opacity,
            'line-width': 2,
          }}
          type="line"
        />
      )
    }

    return (
      <Layer
        id={`${layer.id}-circle`}
        key={`${layer.id}-circle`}
        paint={{
          'circle-color': layer.color,
          'circle-opacity': opacity,
          'circle-radius': 5,
        }}
        type="circle"
      />
    )
  }

  function renderConnectorDataset(dataset: ConnectorDataset) {
    if (!dataset.isVisible) {
      return null
    }

    const shouldRenderSymbolLayer = dataset.sourceType === 'gbif'
    const shouldClusterGbifPoints =
      dataset.sourceType === 'gbif' &&
      dataset.collection.features.length >= gbifClusterThreshold
    const shouldRenderCircleLayer = dataset.sourceType !== 'macrostrat'

    return (
      <Source
        cluster={shouldClusterGbifPoints}
        clusterMaxZoom={shouldClusterGbifPoints ? gbifClusterMaxZoom : undefined}
        clusterRadius={shouldClusterGbifPoints ? gbifClusterRadius : undefined}
        data={dataset.collection}
        id={dataset.id}
        key={dataset.id}
        type="geojson"
      >
        <Layer
          id={`${dataset.id}-fill`}
          filter={
            dataset.sourceType === 'macrostrat'
              ? ['all', ['!=', ['geometry-type'], 'Point'], ['!=', ['geometry-type'], 'LineString']]
              : undefined
          }
          paint={{
            'fill-color': dataset.color,
            'fill-opacity': dataset.sourceType === 'macrostrat' ? 0.11 : 0.22,
            'fill-outline-color': dataset.color,
          }}
          type="fill"
        />
        <Layer
          id={`${dataset.id}-line`}
          filter={shouldClusterGbifPoints ? ['!', ['has', 'point_count']] : undefined}
          paint={{
            'line-color': dataset.color,
            'line-opacity': dataset.sourceType === 'macrostrat' ? 0.88 : 0.92,
            'line-width': dataset.sourceType === 'macrostrat' ? 2.4 : 2.8,
          }}
          type="line"
        />
        {shouldClusterGbifPoints ? (
          <Layer
            filter={['has', 'point_count']}
            id={`${dataset.id}-cluster-circle`}
            paint={{
              'circle-color': 'rgba(255, 248, 239, 0.94)',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                13,
                12,
                15,
                30,
                18,
                60,
                21,
              ],
              'circle-stroke-color': 'rgba(24, 54, 42, 0.18)',
              'circle-stroke-width': 1.5,
            }}
            type="circle"
          />
        ) : null}
        {shouldRenderSymbolLayer && areConnectorIconsReady ? (
          <Layer
            id={`${dataset.id}-symbol`}
            filter={shouldClusterGbifPoints ? ['!', ['has', 'point_count']] : undefined}
            layout={{
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-image': [
                'match',
                ['get', 'category'],
                'flora',
                floraIconId,
                'fauna',
                faunaIconId,
                faunaIconId,
              ],
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                4,
                0.45,
                7,
                0.58,
                10,
                0.72,
              ],
            }}
            type="symbol"
          />
        ) : null}
        {shouldRenderCircleLayer && !shouldRenderSymbolLayer ? (
          <Layer
            id={`${dataset.id}-circle`}
            paint={{
              'circle-color': dataset.color,
              'circle-radius': 5,
              'circle-stroke-color': '#fff7e7',
              'circle-stroke-width': 1.5,
            }}
            type="circle"
          />
        ) : null}
        <Layer
          filter={['==', ['get', 'id'], hoveredFeatureId ?? '']}
          id={`${dataset.id}-hover-highlight-line`}
          paint={{
            'line-color': '#18362a',
            'line-width': 3,
          }}
          type="line"
        />
        {shouldRenderCircleLayer ? (
          <Layer
            filter={['==', ['get', 'id'], hoveredFeatureId ?? '']}
            id={`${dataset.id}-hover-highlight-circle`}
            paint={{
              'circle-color': '#18362a',
              'circle-radius': 7,
              'circle-stroke-color': '#fff7e7',
              'circle-stroke-width': 2,
            }}
            type="circle"
          />
        ) : null}
        <Layer
          filter={['==', ['get', 'id'], selection?.featureId ?? '']}
          id={`${dataset.id}-selection-highlight-line`}
          paint={{
            'line-color': '#c98d2b',
            'line-width': 4,
          }}
          type="line"
        />
        {shouldRenderCircleLayer ? (
          <Layer
            filter={['==', ['get', 'id'], selection?.featureId ?? '']}
            id={`${dataset.id}-selection-highlight-circle`}
            paint={{
              'circle-color': '#c98d2b',
              'circle-radius': 8,
              'circle-stroke-color': '#fff7e7',
              'circle-stroke-width': 2,
            }}
            type="circle"
          />
        ) : null}
      </Source>
    )
  }

  function renderEnvironmentalLayer(layer: EnvironmentalLayer) {
    if (!layer.isVisible) {
      return null
    }

    return (
      <Source
        id={layer.id}
        key={layer.id}
        tileSize={256}
        tiles={[layer.tileUrlTemplate]}
        type="raster"
      >
        <Layer
          id={`${layer.id}-raster`}
          paint={{
            'raster-opacity': layer.opacity,
          }}
          type="raster"
        />
      </Source>
    )
  }

  return (
    <section className="map-canvas" aria-label="Terra map canvas">
      <Map
        cursor={activeTool === 'bbox' ? 'crosshair' : activeTool === 'inspect' ? 'crosshair' : 'grab'}
        dragPan={activeTool !== 'bbox'}
        initialViewState={initialViewState}
        interactiveLayerIds={interactiveLayerIds}
        mapStyle={
          env.VITE_MAP_STYLE_URL
            ? env.VITE_MAP_STYLE_URL
            : hasVisibleEnvironmentalLayers
              ? analysisMapStyle
              : baseMapStyle
        }
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onMouseLeave={() => setHoveredFeatureId(null)}
        onMouseMove={handleMapMouseMove}
        onMouseDown={handleMapMouseDown}
        onMouseUp={handleMapMouseUp}
        onStyleData={handleMapStyleData}
        ref={mapRef}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />

        {environmentalLayers.map(renderEnvironmentalLayer)}

        <Source data={features} id="dataset-features" type="geojson">
          {layers.map(renderLayer)}
          <Layer
            filter={['==', ['get', 'id'], hoveredFeatureId ?? '']}
            id="hover-highlight"
            paint={{
              'line-color': '#18362a',
              'line-width': 3,
            }}
            type="line"
          />
          <Layer
            filter={['==', ['get', 'id'], selection?.featureId ?? '']}
            id="selection-highlight"
            paint={{
              'line-color': '#c98d2b',
              'line-width': 4,
            }}
            type="line"
          />
        </Source>

        {orderedConnectorDatasets.map(renderConnectorDataset)}

        {bboxPreview ? (
          <Source data={bboxPreview} id="bbox-preview" type="geojson">
            <Layer
              id="bbox-preview-fill"
              paint={{
                'fill-color': '#215f53',
                'fill-opacity': 0.14,
              }}
              type="fill"
            />
            <Layer
              id="bbox-preview-line"
              paint={{
                'line-color': '#215f53',
                'line-dasharray': [2, 2],
                'line-width': 2,
              }}
              type="line"
            />
          </Source>
        ) : null}

        {selection && selectedFeature ? (
          <Popup
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            latitude={selection.coordinates[1]}
            longitude={selection.coordinates[0]}
            offset={14}
          >
            <div className="map-canvas__popup">
              <strong>{selectedFeature.properties?.title}</strong>
              <span>{selectedFeature.properties?.municipality}</span>
            </div>
          </Popup>
        ) : null}
      </Map>

    </section>
  )
}
