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
    id: 'connector-workspace',
    name: 'Connector Workspace',
    description: 'Import scientific datasets from connectors to start the session.',
    category: 'biome',
    regionLabel: 'No active region',
    featureCount: 0,
    updatedAt: '2026-04-07T12:00:00.000Z',
    status: 'ready',
    tags: ['connectors', 'session'],
  },
]

const layers: LayerMetadata[] = []

const features: FeatureCollection<Polygon, FeatureProperties> = {
  type: 'FeatureCollection',
  features: [],
}

const uploadHistory: UploadResult[] = []

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
    layers,
    features,
    uploadHistory,
  }
}
