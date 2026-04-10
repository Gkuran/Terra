import { z } from 'zod'

import type { SoilGridsPointSample } from '@/features/environmental-layers/types/environmental-layer'
import { env } from '@/shared/config/env'

const soilGridsPointSampleSchema = z.object({
  source: z.literal('SoilGrids'),
  provider: z.literal('ISRIC'),
  lon: z.number(),
  lat: z.number(),
  samples: z.array(
    z.object({
      property_id: z.string(),
      property_label: z.string(),
      depth_id: z.string(),
      depth_label: z.string(),
      statistic_id: z.string(),
      statistic_label: z.string(),
      unit: z.string(),
      value: z.number().nullable(),
    }),
  ),
})

export interface RequestSoilGridsPointSampleInput {
  lon: number
  lat: number
  layers: Array<{
    propertyId: string
    depthId: string
    statisticId: string
  }>
}

export async function requestSoilGridsPointSample({
  lon,
  lat,
  layers,
}: RequestSoilGridsPointSampleInput): Promise<SoilGridsPointSample[]> {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for environmental layer queries.')
  }

  const response = await fetch(
    `${env.VITE_API_BASE_URL}/api/v1/environmental-layers/soilgrids/point-sample`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lon,
        lat,
        propertyIds: [...new Set(layers.map((layer) => layer.propertyId))],
        depthIds: [...new Set(layers.map((layer) => layer.depthId))],
        statisticIds: [...new Set(layers.map((layer) => layer.statisticId))],
      }),
    },
  )

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const detail =
      errorPayload &&
      typeof errorPayload === 'object' &&
      'detail' in errorPayload &&
      typeof errorPayload.detail === 'string'
        ? errorPayload.detail
        : 'SoilGrids point sample could not be retrieved.'

    throw new Error(detail)
  }

  const json = await response.json()
  const parsed = soilGridsPointSampleSchema.parse(json)
  const requestedLayerIds = new Set(
    layers.map(
      (layer) => `${layer.propertyId}:${layer.depthId}:${layer.statisticId}`,
    ),
  )

  return parsed.samples
    .filter((sample) =>
      requestedLayerIds.has(
        `${sample.property_id}:${sample.depth_id}:${sample.statistic_id}`,
      ),
    )
    .map((sample) => ({
      propertyId: sample.property_id,
      propertyLabel: sample.property_label,
      depthId: sample.depth_id,
      depthLabel: sample.depth_label,
      statisticId: sample.statistic_id,
      statisticLabel: sample.statistic_label,
      unit: sample.unit,
      value: sample.value,
    }))
}
