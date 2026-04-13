import type { StorageValue } from 'zustand/middleware'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'

import {
  createConnectorDataset,
  ensureConnectorDatasetProvenance,
} from '@/features/connectors/lib/create-connector-dataset'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { ConnectorQueryHistoryEntry } from '@/features/connectors/types/connector-query-history'

const maxRecentConnectorQueries = 8

const connectorFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['flora', 'fauna', 'biome', 'soil', 'dataset', 'geology']),
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
  geometry: z.union([
    z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    z.object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
    }),
    z.object({
      type: z.literal('MultiPolygon'),
      coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
    }),
  ]),
  properties: connectorFeaturePropertiesSchema,
})

const connectorDatasetSchema = z.object({
  id: z.string(),
  color: z.string(),
  context: z.enum(['bbox', 'manual']),
  importedAt: z.string(),
  isVisible: z.boolean(),
  label: z.string(),
  sourceType: z.enum(['csv', 'gbif', 'shapefile', 'macrostrat', 'wosis']),
  tone: z.enum(['copper', 'moss', 'ocean', 'plum', 'amber', 'olive']),
  provenance: z
    .object({
      provider: z.enum(['CSV', 'GBIF', 'Macrostrat', 'Shapefile', 'WoSIS', 'Unknown']),
      sourceName: z.string(),
      importedAt: z.string(),
      recordCount: z.number(),
      queryLabel: z.string().nullable(),
      queryParams: z.record(z.string(), z.string()),
      notes: z.array(z.string()),
    })
    .optional(),
  collection: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(connectorFeatureSchema),
  }),
})

const persistedConnectorDatasetsStateSchema = z.object({
  datasets: z.array(connectorDatasetSchema),
  recentQueries: z
    .array(
      z.object({
        id: z.string(),
        context: z.enum(['bbox', 'manual']),
        recordedAt: z.string(),
        sourceType: z.enum(['csv', 'gbif', 'shapefile', 'macrostrat', 'wosis']),
        label: z.string(),
        provenance: z.object({
          provider: z.enum(['CSV', 'GBIF', 'Macrostrat', 'Shapefile', 'WoSIS', 'Unknown']),
          sourceName: z.string(),
          importedAt: z.string(),
          recordCount: z.number(),
          queryLabel: z.string().nullable(),
          queryParams: z.record(z.string(), z.string()),
          notes: z.array(z.string()),
        }),
      }),
    )
    .optional(),
})

interface AddConnectorDatasetInput {
  collection: ConnectorDataset['collection']
  context: ConnectorDataset['context']
  label: string
  provenance?: Partial<ConnectorDataset['provenance']>
  sourceType: ConnectorDataset['sourceType']
}

interface ConnectorDatasetsState {
  datasets: ConnectorDataset[]
  recentQueries: ConnectorQueryHistoryEntry[]
  addDataset: (input: AddConnectorDatasetInput) => void
  clearDatasets: () => void
  removeDataset: (datasetId: string) => void
  replaceDatasets: (datasets: ConnectorDataset[]) => void
  replaceRecentQueries: (recentQueries: ConnectorQueryHistoryEntry[]) => void
  setDatasetVisibility: (datasetId: string, isVisible: boolean) => void
}

export const useConnectorDatasetsStore = create<ConnectorDatasetsState>()(
  persist(
    (set) => ({
      datasets: [],
      recentQueries: [],
      addDataset: (input) =>
        set((state) => {
          const nextDataset = createConnectorDataset({
            ...input,
            order: state.datasets.length,
          })

          const nextHistoryEntry: ConnectorQueryHistoryEntry = {
            id: `query-${nextDataset.id}`,
            context: nextDataset.context,
            recordedAt: nextDataset.importedAt,
            sourceType: nextDataset.sourceType,
            label: nextDataset.label,
            provenance: nextDataset.provenance,
          }

          const deduplicatedHistory = state.recentQueries.filter((entry) => {
            const sameSourceType = entry.sourceType === nextHistoryEntry.sourceType
            const sameContext = entry.context === nextHistoryEntry.context
            const sameLabel = entry.label === nextHistoryEntry.label
            const sameParams =
              JSON.stringify(entry.provenance.queryParams) ===
              JSON.stringify(nextHistoryEntry.provenance.queryParams)

            return !(sameSourceType && sameContext && sameLabel && sameParams)
          })

          return {
            datasets: [...state.datasets, nextDataset],
            recentQueries: [nextHistoryEntry, ...deduplicatedHistory].slice(
              0,
              maxRecentConnectorQueries,
            ),
          }
        }),
      clearDatasets: () => set({ datasets: [] }),
      removeDataset: (datasetId) =>
        set((state) => ({
          datasets: state.datasets.filter((dataset) => dataset.id !== datasetId),
        })),
      replaceDatasets: (datasets) =>
        set({
          datasets: datasets.map((dataset) => ensureConnectorDatasetProvenance(dataset)),
        }),
      replaceRecentQueries: (recentQueries) =>
        set({
          recentQueries: recentQueries.slice(0, maxRecentConnectorQueries),
        }),
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
        recentQueries: state.recentQueries,
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
          datasets: parsed.data.datasets.map((dataset) =>
            ensureConnectorDatasetProvenance(dataset),
          ),
          recentQueries: parsed.data.recentQueries ?? [],
        }
      },
    },
  ),
)
