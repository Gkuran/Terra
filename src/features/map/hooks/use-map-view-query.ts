import { useQuery } from '@tanstack/react-query'

import {
  getMapViewData,
  type MapViewScenario,
} from '@/features/map/api/get-map-view-data'

export function useMapViewQuery(
  scenario: MapViewScenario,
  datasetId?: string,
) {
  return useQuery({
    queryKey: ['map-view', scenario, datasetId ?? 'default'],
    queryFn: () => getMapViewData(scenario, datasetId),
  })
}
