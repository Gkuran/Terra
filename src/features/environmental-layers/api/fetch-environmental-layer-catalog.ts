import { z } from 'zod'

import type { SoilGridsCatalog } from '@/features/environmental-layers/types/environmental-layer'
import { env } from '@/shared/config/env'

const soilGridsDepthSchema = z.object({
  id: z.string(),
  label: z.string(),
})

const soilGridsPropertySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  unit: z.string(),
  depths: z.array(soilGridsDepthSchema),
  statistics: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
})

const soilGridsCatalogSchema = z.object({
  metadata: z.object({
    source: z.literal('SoilGrids'),
    provider: z.literal('ISRIC'),
    source_type: z.literal('environmental-layer'),
    description: z.string(),
    attribution: z.string(),
  }),
  properties: z.array(soilGridsPropertySchema),
})

export async function fetchEnvironmentalLayerCatalog(): Promise<SoilGridsCatalog> {
  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for environmental layer queries.')
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}/api/v1/environmental-layers/catalog`)

  if (!response.ok) {
    throw new Error('Environmental layer catalog could not be loaded.')
  }

  const json = await response.json()
  const parsed = soilGridsCatalogSchema.parse(json)

  return {
    metadata: {
      source: parsed.metadata.source,
      provider: parsed.metadata.provider,
      sourceType: parsed.metadata.source_type,
      description: parsed.metadata.description,
      attribution: parsed.metadata.attribution,
    },
    properties: parsed.properties.map((property) => ({
      id: property.id,
      label: property.label,
      description: property.description,
      unit: property.unit,
      depths: property.depths,
      statistics: property.statistics,
    })),
  }
}
