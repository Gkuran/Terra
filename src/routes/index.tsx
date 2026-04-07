import { createRoute } from '@tanstack/react-router'
import { z } from 'zod'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import { useMapViewQuery } from '@/features/map/hooks/use-map-view-query'
import type { MapViewScenario } from '@/features/map/api/get-map-view-data'
import { MapViewPage } from '@/pages/map-view/map-view-page'
import { rootRoute } from '@/routes/__root'
import { parseWithSchema } from '@/shared/lib/zod/parse-with-schema'

const searchSchema = z.object({
  datasetId: z.string().optional(),
  scenario: z.enum(['default', 'loading', 'empty', 'error']).catch('default'),
})

function buildFallbackDataset(
  scenario: MapViewScenario,
  description?: string,
): DatasetMetadata {
  return {
    id: 'southern-biomes',
    name: scenario === 'error' ? 'Dataset unavailable' : 'Loading dataset',
    description,
    category: 'biome',
    regionLabel: scenario === 'error' ? 'Mock failure state' : 'Preparing context',
    featureCount: 0,
    updatedAt: new Date().toISOString(),
    status: 'processing',
    tags: [scenario],
  }
}

function IndexRouteComponent() {
  const search = indexRoute.useSearch()
  const navigate = indexRoute.useNavigate()
  const query = useMapViewQuery(search.scenario, search.datasetId)

  const handleDatasetChange = (datasetId: string) =>
    navigate({
      search: {
        ...search,
        datasetId,
      },
    })

  const handleScenarioChange = (scenario: MapViewScenario) =>
    navigate({
      search: {
        ...search,
        scenario,
      },
    })

  if (query.isPending) {
    return (
      <MapViewPage
        dataset={buildFallbackDataset('loading')}
        datasets={[]}
        features={{ type: 'FeatureCollection', features: [] }}
        layers={[]}
        onDatasetChange={handleDatasetChange}
        onScenarioChange={handleScenarioChange}
        scenario={search.scenario}
        stateMessage="Simulating remote dataset preparation for the current operational view."
        uploadHistory={[]}
      />
    )
  }

  if (query.isError) {
    return (
      <MapViewPage
        dataset={buildFallbackDataset('error', query.error.message)}
        datasets={[]}
        features={{ type: 'FeatureCollection', features: [] }}
        layers={[]}
        onDatasetChange={handleDatasetChange}
        onScenarioChange={handleScenarioChange}
        scenario={search.scenario}
        stateMessage={query.error.message}
        uploadHistory={[]}
      />
    )
  }

  const data = query.data

  if (!data) {
    return null
  }

  const activeDataset =
    data.datasets.find((dataset) => dataset.id === data.activeDatasetId) ?? data.datasets[0]

  return (
    <MapViewPage
      dataset={activeDataset}
      datasets={data.datasets}
      features={data.features}
      layers={data.layers}
      onDatasetChange={handleDatasetChange}
      onScenarioChange={handleScenarioChange}
      scenario={search.scenario}
      stateMessage={
        search.scenario === 'empty'
          ? 'This scenario intentionally clears overlays so the empty-state workflow can be reviewed.'
          : undefined
      }
      uploadHistory={data.uploadHistory}
    />
  )
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRouteComponent,
  validateSearch: (search) => parseWithSchema(searchSchema, search),
})
