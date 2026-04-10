import { z } from 'zod'

import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import { env } from '@/shared/config/env'

const soilGridsLayerSchema = z.object({
  id: z.string(),
  type: z.literal('soilgrids'),
  provider: z.literal('ISRIC'),
  label: z.string(),
  description: z.string(),
  property_id: z.string(),
  property_label: z.string(),
  depth_id: z.string(),
  depth_label: z.string(),
  statistic_id: z.string(),
  statistic_label: z.string(),
  unit: z.string(),
  attribution: z.string(),
  tile_url_template: z.string(),
  legend: z.object({
    url: z.string(),
  }),
})

export interface RequestSoilGridsLayerInput {
  propertyId: string
  depthId: string
  statisticId: string
}

export async function requestSoilGridsLayer({
  propertyId,
  depthId,
  statisticId,
}: RequestSoilGridsLayerInput): Promise<EnvironmentalLayer> {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for environmental layer queries.')
  }

  const searchParams = new URLSearchParams({
    depth_id: depthId,
    statistic_id: statisticId,
  })
  const response = await fetch(
    `${env.VITE_API_BASE_URL}/api/v1/environmental-layers/soilgrids/layers/${propertyId}?${searchParams.toString()}`,
  )

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const detail =
      errorPayload &&
      typeof errorPayload === 'object' &&
      'detail' in errorPayload &&
      typeof errorPayload.detail === 'string'
        ? errorPayload.detail
        : 'SoilGrids layer could not be created.'

    throw new Error(detail)
  }

  const json = await response.json()
  const parsed = soilGridsLayerSchema.parse(json)

  return {
    id: parsed.id,
    type: parsed.type,
    provider: parsed.provider,
    label: parsed.label,
    description: parsed.description,
    propertyId: parsed.property_id,
    propertyLabel: parsed.property_label,
    depthId: parsed.depth_id,
    depthLabel: parsed.depth_label,
    statisticId: parsed.statistic_id,
    statisticLabel: parsed.statistic_label,
    unit: parsed.unit,
    attribution: parsed.attribution,
    tileUrlTemplate: parsed.tile_url_template,
    legend: {
      url: parsed.legend.url,
    },
    isVisible: true,
    opacity: 0.88,
  }
}
