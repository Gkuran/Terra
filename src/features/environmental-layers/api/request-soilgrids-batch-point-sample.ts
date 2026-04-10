import { z } from 'zod'

import type { SoilGridsPointSample } from '@/features/environmental-layers/types/environmental-layer'
import { env } from '@/shared/config/env'

const soilGridsPointSampleSchema = z.object({
  property_id: z.string(),
  property_label: z.string(),
  depth_id: z.string(),
  depth_label: z.string(),
  statistic_id: z.string(),
  statistic_label: z.string(),
  unit: z.string(),
  value: z.number().nullable(),
})

const soilGridsBatchPointSampleSchema = z.object({
  source: z.literal('SoilGrids'),
  provider: z.literal('ISRIC'),
  items: z.array(
    z.object({
      id: z.string(),
      lon: z.number(),
      lat: z.number(),
      samples: z.array(soilGridsPointSampleSchema),
    }),
  ),
})

export interface SoilGridsBatchPointInput {
  id: string
  lon: number
  lat: number
}

export interface RequestSoilGridsBatchPointSampleInput {
  points: SoilGridsBatchPointInput[]
  layers: Array<{
    propertyId: string
    depthId: string
    statisticId: string
  }>
}

export async function requestSoilGridsBatchPointSample({
  points,
  layers,
}: RequestSoilGridsBatchPointSampleInput) {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for environmental layer queries.')
  }

  const response = await fetch(
    `${env.VITE_API_BASE_URL}/api/v1/environmental-layers/soilgrids/batch-point-sample`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points,
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
        : 'SoilGrids batch point sample could not be retrieved.'

    throw new Error(detail)
  }

  const json = await response.json()
  const parsed = soilGridsBatchPointSampleSchema.parse(json)
  const requestedLayerIds = new Set(
    layers.map(
      (layer) => `${layer.propertyId}:${layer.depthId}:${layer.statisticId}`,
    ),
  )

  return parsed.items.map((item) => ({
    id: item.id,
    lon: item.lon,
    lat: item.lat,
    samples: item.samples
      .filter((sample) =>
        requestedLayerIds.has(
          `${sample.property_id}:${sample.depth_id}:${sample.statistic_id}`,
        ),
      )
      .map<SoilGridsPointSample>((sample) => ({
        propertyId: sample.property_id,
        propertyLabel: sample.property_label,
        depthId: sample.depth_id,
        depthLabel: sample.depth_label,
        statisticId: sample.statistic_id,
        statisticLabel: sample.statistic_label,
        unit: sample.unit,
        value: sample.value,
      })),
  }))
}
