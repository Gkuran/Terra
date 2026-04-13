import { requestSoilGridsBatchPointSample } from '@/features/environmental-layers/api/request-soilgrids-batch-point-sample'
import type { SoilGridsBatchPointInput } from '@/features/environmental-layers/api/request-soilgrids-batch-point-sample'
import { requestSoilGridsPointSample } from '@/features/environmental-layers/api/request-soilgrids-point-sample'

interface SoilGridsLayerRequest {
  propertyId: string
  depthId: string
  statisticId: string
}

interface ResilientSoilGridsSampleItem {
  id: string
  lon: number
  lat: number
  samples: Awaited<ReturnType<typeof requestSoilGridsPointSample>>
}

interface RequestResilientSoilGridsSamplesInput {
  points: SoilGridsBatchPointInput[]
  layers: SoilGridsLayerRequest[]
}

interface RequestResilientSoilGridsSamplesResult {
  items: ResilientSoilGridsSampleItem[]
  warnings: string[]
}

function buildRequestedLayerIds(layers: SoilGridsLayerRequest[]) {
  return new Set(
    layers.map((layer) => `${layer.propertyId}:${layer.depthId}:${layer.statisticId}`),
  )
}

function buildReturnedLayerIds(samples: ResilientSoilGridsSampleItem['samples']) {
  return new Set(
    samples.map((sample) => `${sample.propertyId}:${sample.depthId}:${sample.statisticId}`),
  )
}

function isSampleItemComplete(
  item: ResilientSoilGridsSampleItem,
  requestedLayerIds: Set<string>,
) {
  const returnedLayerIds = buildReturnedLayerIds(item.samples)

  if (returnedLayerIds.size < requestedLayerIds.size) {
    return false
  }

  for (const requestedLayerId of requestedLayerIds) {
    if (!returnedLayerIds.has(requestedLayerId)) {
      return false
    }
  }

  return true
}

export async function requestResilientSoilGridsSamples({
  points,
  layers,
}: RequestResilientSoilGridsSamplesInput): Promise<RequestResilientSoilGridsSamplesResult> {
  const warnings: string[] = []
  const requestedLayerIds = buildRequestedLayerIds(layers)
  const pointById = new Map(points.map((point) => [point.id, point]))
  let items: ResilientSoilGridsSampleItem[] = []

  try {
    items = await requestSoilGridsBatchPointSample({
      points,
      layers,
    })
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Batch SoilGrids sampling failed and individual retries were used: ${error.message}`
        : 'Batch SoilGrids sampling failed and individual retries were used.',
    )
  }

  const completeItemsById = new Map(
    items
      .filter((item) => isSampleItemComplete(item, requestedLayerIds))
      .map((item) => [item.id, item]),
  )

  const missingPoints = points.filter((point) => !completeItemsById.has(point.id))

  if (missingPoints.length === 0) {
    return {
      items: points.flatMap((point) => {
        const item = completeItemsById.get(point.id)
        return item ? [item] : []
      }),
      warnings,
    }
  }

  const fallbackResults = await Promise.allSettled(
    missingPoints.map(async (point) => ({
      id: point.id,
      lon: point.lon,
      lat: point.lat,
      samples: await requestSoilGridsPointSample({
        lon: point.lon,
        lat: point.lat,
        layers,
      }),
    })),
  )

  for (const result of fallbackResults) {
    if (result.status === 'fulfilled') {
      completeItemsById.set(result.value.id, result.value)
      continue
    }

    warnings.push(
      result.reason instanceof Error
        ? `Individual SoilGrids retry failed: ${result.reason.message}`
        : 'Individual SoilGrids retry failed.',
    )
  }

  const orderedItems = points.flatMap((point) => {
    const item = completeItemsById.get(point.id)

    if (item) {
      return [item]
    }

    const fallbackPoint = pointById.get(point.id)

    if (!fallbackPoint) {
      return []
    }

    return [
      {
        id: fallbackPoint.id,
        lon: fallbackPoint.lon,
        lat: fallbackPoint.lat,
        samples: [],
      },
    ]
  })

  if (missingPoints.length > 0) {
    warnings.push(
      `Resilient SoilGrids sampling retried ${missingPoints.length} point(s) individually.`,
    )
  }

  return {
    items: orderedItems,
    warnings,
  }
}
