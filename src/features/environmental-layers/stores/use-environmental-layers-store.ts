import type { StorageValue } from 'zustand/middleware'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'

import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'

const environmentalLayerSchema = z.object({
  id: z.string(),
  type: z.literal('soilgrids'),
  provider: z.literal('ISRIC'),
  label: z.string(),
  description: z.string(),
  propertyId: z.string(),
  propertyLabel: z.string(),
  depthId: z.string(),
  depthLabel: z.string(),
  statisticId: z.string(),
  statisticLabel: z.string(),
  unit: z.string(),
  attribution: z.string(),
  tileUrlTemplate: z.string(),
  legend: z.object({
    url: z.string(),
  }),
  isVisible: z.boolean(),
  opacity: z.number().min(0).max(1),
})

const persistedEnvironmentalLayersStateSchema = z.object({
  layers: z.array(environmentalLayerSchema),
})

interface EnvironmentalLayersState {
  layers: EnvironmentalLayer[]
  addLayer: (layer: EnvironmentalLayer) => void
  removeLayer: (layerId: string) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
  setLayerVisibility: (layerId: string, isVisible: boolean) => void
}

export const useEnvironmentalLayersStore = create<EnvironmentalLayersState>()(
  persist(
    (set) => ({
      layers: [],
      addLayer: (layer) =>
        set((state) => ({
          layers: state.layers.some((entry) => entry.id === layer.id)
            ? state.layers.map((entry) => (entry.id === layer.id ? layer : entry))
            : [...state.layers, layer],
        })),
      removeLayer: (layerId) =>
        set((state) => ({
          layers: state.layers.filter((layer) => layer.id !== layerId),
        })),
      setLayerOpacity: (layerId, opacity) =>
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === layerId ? { ...layer, opacity } : layer,
          ),
        })),
      setLayerVisibility: (layerId, isVisible) =>
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === layerId ? { ...layer, isVisible } : layer,
          ),
        })),
    }),
    {
      name: 'terra-environmental-layers',
      partialize: (state) => ({ layers: state.layers }),
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const parsed = persistedEnvironmentalLayersStateSchema.safeParse(
          (persistedState as StorageValue<unknown> | undefined)?.state,
        )

        if (!parsed.success) {
          return currentState
        }

        return {
          ...currentState,
          layers: parsed.data.layers as EnvironmentalLayer[],
        }
      },
    },
  ),
)
