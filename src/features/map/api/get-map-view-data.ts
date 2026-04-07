import type { FeatureCollection, Polygon } from 'geojson'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'

export type MapViewScenario = 'default' | 'loading' | 'empty' | 'error'

export interface MapViewData {
  datasets: DatasetMetadata[]
  activeDatasetId: string
  layers: LayerMetadata[]
  features: FeatureCollection<Polygon, FeatureProperties>
  uploadHistory: UploadResult[]
}

const datasets: DatasetMetadata[] = [
  {
    id: 'southern-biomes',
    name: 'Southern Biomes Survey',
    description: 'Regional biome coverage and conservation priorities.',
    category: 'biome',
    regionLabel: 'Rio Grande do Sul',
    featureCount: 3,
    updatedAt: '2026-04-05T14:10:00.000Z',
    status: 'ready',
    tags: ['biome', 'survey', 'baseline'],
  },
  {
    id: 'soil-sensitivity',
    name: 'Soil Sensitivity Index',
    description: 'Priority polygons for soil protection and erosion monitoring.',
    category: 'soil',
    regionLabel: 'Santa Catarina',
    featureCount: 2,
    updatedAt: '2026-04-04T09:25:00.000Z',
    status: 'processing',
    tags: ['soil', 'erosion', 'priority'],
  },
]

const layers: LayerMetadata[] = [
  {
    id: 'biome-zones',
    datasetId: 'southern-biomes',
    name: 'Biome Zones',
    description: 'Primary biome polygons for the selected survey.',
    geometryType: 'fill',
    color: '#2b6a57',
    defaultOpacity: 0.46,
    isVisibleByDefault: true,
    featureCount: 3,
    legendLabel: 'Biome coverage',
  },
  {
    id: 'conservation-outline',
    datasetId: 'southern-biomes',
    name: 'Conservation Outline',
    description: 'Review perimeter for conservation field operations.',
    geometryType: 'line',
    color: '#9dd3a8',
    defaultOpacity: 0.9,
    isVisibleByDefault: true,
    featureCount: 3,
    legendLabel: 'Inspection perimeter',
  },
]

const features: FeatureCollection<Polygon, FeatureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-51.34, -30.09],
            [-51.16, -30.09],
            [-51.16, -29.95],
            [-51.34, -29.95],
            [-51.34, -30.09],
          ],
        ],
      },
      properties: {
        id: 'feature-1',
        title: 'Mixed Araucaria Patch',
        category: 'biome',
        scientificName: 'Araucaria angustifolia',
        biome: 'Atlantic Forest',
        municipality: 'São Francisco de Paula',
        status: 'stable',
        summary: 'Consolidated forest patch with stable canopy and moderate edge pressure.',
        observedAt: '2026-03-20T10:15:00.000Z',
        datasetId: 'southern-biomes',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-50.98, -29.76],
            [-50.79, -29.76],
            [-50.79, -29.61],
            [-50.98, -29.61],
            [-50.98, -29.76],
          ],
        ],
      },
      properties: {
        id: 'feature-2',
        title: 'Grassland Transition Sector',
        category: 'biome',
        scientificName: 'Paspalum notatum',
        biome: 'Pampa',
        municipality: 'Vacaria',
        status: 'attention',
        summary: 'Transition zone with advancing shrub cover and fragmented sampling access.',
        observedAt: '2026-03-18T15:40:00.000Z',
        datasetId: 'southern-biomes',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-51.6, -29.6],
            [-51.42, -29.6],
            [-51.42, -29.45],
            [-51.6, -29.45],
            [-51.6, -29.6],
          ],
        ],
      },
      properties: {
        id: 'feature-3',
        title: 'Riparian Monitoring Block',
        category: 'biome',
        scientificName: 'Eryngium pandanifolium',
        biome: 'Wetland Mosaic',
        municipality: 'Montenegro',
        status: 'critical',
        summary: 'Hydrological stress signals detected near the riparian buffer.',
        observedAt: '2026-03-12T08:05:00.000Z',
        datasetId: 'southern-biomes',
      },
    },
  ],
}

const uploadHistory: UploadResult[] = [
  {
    id: 'upload-1',
    sourceName: 'field-notes-sample.zip',
    featureCount: 18,
    importedAt: '2026-04-06T16:20:00.000Z',
    status: 'success',
    message: 'Converted to GeoJSON and ready for review.',
  },
]

function wait(durationMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs))
}

export async function getMapViewData(
  scenario: MapViewScenario,
  datasetId?: string,
): Promise<MapViewData> {
  const activeDataset = datasets.find((dataset) => dataset.id === datasetId) ?? datasets[0]

  if (scenario === 'loading') {
    await wait(1200)
  } else {
    await wait(280)
  }

  if (scenario === 'error') {
    throw new Error('Mock dataset retrieval failed. Check connectivity rules for the selected dataset.')
  }

  if (scenario === 'empty') {
    return {
      datasets,
      activeDatasetId: activeDataset.id,
      layers: [],
      features: {
        type: 'FeatureCollection',
        features: [],
      },
      uploadHistory: [],
    }
  }

  return {
    datasets,
    activeDatasetId: activeDataset.id,
    layers: layers.filter((layer) => layer.datasetId === activeDataset.id),
    features: {
      ...features,
      features: features.features.filter(
        (feature) => feature.properties.datasetId === activeDataset.id,
      ),
    },
    uploadHistory,
  }
}
