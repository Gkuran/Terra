import { useEffect, useMemo, useRef } from 'react'
import type {
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Position,
} from 'geojson'
import Map, {
  Layer,
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type StyleSpecification,
} from 'react-map-gl/maplibre'

import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import { useLayerPresentationStore } from '@/features/layers/stores/use-layer-presentation-store'
import { useMapUiStore } from '@/features/map/stores/use-map-ui-store'
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

const initialViewState = {
  longitude: -51.15,
  latitude: -29.92,
  zoom: 7.2,
}

interface MapCanvasProps {
  features: FeatureCollection<Geometry, GeoJsonProperties>
  layers: LayerMetadata[]
  connectorDatasets: ConnectorDataset[]
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
}: MapCanvasProps) {
  const mapRef = useRef<MapRef | null>(null)
  const visibilityById = useLayerPresentationStore((state) => state.visibilityById)
  const opacityById = useLayerPresentationStore((state) => state.opacityById)
  const activeTool = useMapUiStore((state) => state.activeTool)
  const selection = useMapUiStore((state) => state.selection)
  const setSelection = useMapUiStore((state) => state.setSelection)
  const hoveredFeatureId = useMapUiStore((state) => state.hoveredFeatureId)
  const setHoveredFeatureId = useMapUiStore((state) => state.setHoveredFeatureId)

  const selectedFeature = useMemo(
    () =>
      [
        ...features.features,
        ...connectorDatasets.flatMap((dataset) => dataset.collection.features),
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
      ...connectorDatasets.flatMap((dataset) => [
        `${dataset.id}-fill`,
        `${dataset.id}-line`,
        `${dataset.id}-circle`,
      ]),
    ],
    [connectorDatasets, layers],
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

  function handleMapClick(event: MapMouseEvent) {
    if (activeTool !== 'inspect') {
      return
    }

    const [topFeature] = event.features ?? []

    if (!topFeature || !topFeature.properties) {
      setSelection(null)
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

  function handleMapHover(event: MapLayerMouseEvent) {
    const [topFeature] = event.features ?? []

    if (!topFeature || !topFeature.properties) {
      setHoveredFeatureId(null)
      return
    }

    const hoveredId =
      typeof topFeature.properties.id === 'string' ? topFeature.properties.id : null

    setHoveredFeatureId(hoveredId)
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
    return (
      <Source
        data={dataset.collection}
        id={dataset.id}
        key={dataset.id}
        type="geojson"
      >
        <Layer
          id={`${dataset.id}-fill`}
          paint={{
            'fill-color': dataset.color,
            'fill-opacity': 0.22,
            'fill-outline-color': dataset.color,
          }}
          type="fill"
        />
        <Layer
          id={`${dataset.id}-line`}
          paint={{
            'line-color': dataset.color,
            'line-opacity': 0.92,
            'line-width': 2.8,
          }}
          type="line"
        />
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
        <Layer
          filter={['==', ['get', 'id'], hoveredFeatureId ?? '']}
          id={`${dataset.id}-hover-highlight-line`}
          paint={{
            'line-color': '#18362a',
            'line-width': 3,
          }}
          type="line"
        />
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
        <Layer
          filter={['==', ['get', 'id'], selection?.featureId ?? '']}
          id={`${dataset.id}-selection-highlight-line`}
          paint={{
            'line-color': '#c98d2b',
            'line-width': 4,
          }}
          type="line"
        />
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
      </Source>
    )
  }

  return (
    <section className="map-canvas" aria-label="Terra map canvas">
      <Map
        cursor={activeTool === 'inspect' ? 'crosshair' : 'grab'}
        initialViewState={initialViewState}
        interactiveLayerIds={interactiveLayerIds}
        mapStyle={env.VITE_MAP_STYLE_URL ?? baseMapStyle}
        onClick={handleMapClick}
        onMouseLeave={() => setHoveredFeatureId(null)}
        onMouseMove={handleMapHover}
        ref={mapRef}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        <ScaleControl position="bottom-right" />

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

        {connectorDatasets.map(renderConnectorDataset)}

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
