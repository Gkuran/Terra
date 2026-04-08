import type { StorageValue } from 'zustand/middleware'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'

import { createConnectorDataset } from '@/features/connectors/lib/create-connector-dataset'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

const connectorFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['flora', 'fauna', 'biome', 'soil', 'dataset']),
  scientificName: z.string().optional(),
  biome: z.string(),
  municipality: z.string(),
  status: z.enum(['stable', 'attention', 'critical']),
  summary: z.string(),
  observedAt: z.string(),
  datasetId: z.string(),
  rawAttributes: z.record(z.string(), z.string()).optional(),
}).catchall(z.unknown())

const connectorFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.string(),
  }).catchall(z.unknown()),
  properties: connectorFeaturePropertiesSchema,
})

const connectorDatasetSchema = z.object({
  id: z.string(),
  color: z.string(),
  context: z.enum(['bbox', 'manual']),
  importedAt: z.string(),
  isVisible: z.boolean(),
  label: z.string(),
  sourceType: z.enum(['csv', 'gbif', 'shapefile']),
  tone: z.enum(['copper', 'moss', 'ocean', 'plum', 'amber', 'olive']),
  collection: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(connectorFeatureSchema),
  }),
})

const persistedConnectorDatasetsStateSchema = z.object({
  datasets: z.array(connectorDatasetSchema),
})

interface AddConnectorDatasetInput {
  collection: ConnectorDataset['collection']
  context: ConnectorDataset['context']
  label: string
  sourceType: ConnectorDataset['sourceType']
}

interface ConnectorDatasetsState {
  datasets: ConnectorDataset[]
  addDataset: (input: AddConnectorDatasetInput) => void
  clearDatasets: () => void
  removeDataset: (datasetId: string) => void
  setDatasetVisibility: (datasetId: string, isVisible: boolean) => void
}

export const useConnectorDatasetsStore = create<ConnectorDatasetsState>()(
  persist(
    (set) => ({
      datasets: [],
      addDataset: (input) =>
        set((state) => ({
          datasets: [
            ...state.datasets,
            createConnectorDataset({
              ...input,
              order: state.datasets.length,
            }),
          ],
        })),
      clearDatasets: () => set({ datasets: [] }),
      removeDataset: (datasetId) =>
        set((state) => ({
          datasets: state.datasets.filter((dataset) => dataset.id !== datasetId),
        })),
      setDatasetVisibility: (datasetId, isVisible) =>
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? { ...dataset, isVisible }
              : dataset,
          ),
        })),
    }),
    {
      name: 'terra-connector-datasets',
      partialize: (state) => ({
        datasets: state.datasets,
      }),
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const parsed = persistedConnectorDatasetsStateSchema.safeParse(
          (persistedState as StorageValue<unknown> | undefined)?.state,
        )

        if (!parsed.success) {
          return currentState
        }

        return {
          ...currentState,
          datasets: parsed.data.datasets as unknown as ConnectorDataset[],
        }
      },
    },
  ),
)
