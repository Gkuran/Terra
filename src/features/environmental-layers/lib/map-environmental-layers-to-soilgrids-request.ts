import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'

export function mapEnvironmentalLayersToSoilGridsRequest(
  layers: EnvironmentalLayer[],
) {
  return layers.map((layer) => ({
    propertyId: layer.propertyId,
    depthId: layer.depthId,
    statisticId: layer.statisticId,
  }))
}
