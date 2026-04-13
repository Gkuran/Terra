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

function normalizePersistedQueryParams(
  queryParams: Record<string, string | number | boolean | null>,
) {
  return Object.fromEntries(
    Object.entries(queryParams).map(([key, value]) => [key, value === null ? '' : `${value}`]),
  )
}

function normalizePersistedConnectorDataset(
  dataset: z.infer<typeof connectorDatasetSchema>,
): ConnectorDataset {
  return ensureConnectorDatasetProvenance({
    ...dataset,
    collection: {
      ...dataset.collection,
      features: dataset.collection.features.map((feature, index) => {
        const currentProperties = feature.properties

        return {
          ...feature,
          properties: {
            ...currentProperties,
            id: currentProperties.id,
            datasetId: currentProperties.datasetId,
            title:
              typeof currentProperties.title === 'string' &&
              currentProperties.title.trim() !== ''
                ? currentProperties.title
                : `Imported feature ${index + 1}`,
            category:
              currentProperties.category === 'flora' ||
              currentProperties.category === 'fauna' ||
              currentProperties.category === 'biome' ||
              currentProperties.category === 'soil' ||
              currentProperties.category === 'geology'
                ? currentProperties.category
                : 'dataset',
            biome:
              typeof currentProperties.biome === 'string'
                ? currentProperties.biome
                : '',
            municipality:
              typeof currentProperties.municipality === 'string'
                ? currentProperties.municipality
                : '',
            status:
              currentProperties.status === 'attention' ||
              currentProperties.status === 'critical'
                ? currentProperties.status
                : 'stable',
            summary:
              typeof currentProperties.summary === 'string'
                ? currentProperties.summary
                : '',
            observedAt:
              typeof currentProperties.observedAt === 'string'
                ? currentProperties.observedAt
                : '',
            rawAttributes: currentProperties.rawAttributes
              ? Object.fromEntries(
                  Object.entries(currentProperties.rawAttributes).map(([key, value]) => [
                    key,
                    value === null ? '' : `${value}`,
                  ]),
                )
              : undefined,
          },
        }
      }),
    },
    provenance: dataset.provenance
      ? {
          ...dataset.provenance,
          queryParams: normalizePersistedQueryParams(dataset.provenance.queryParams),
        }
      : undefined,
  })
}

function normalizePersistedRecentQuery(
  entry: {
    id: string
    context: 'bbox' | 'manual'
    recordedAt: string
    sourceType: 'csv' | 'gbif' | 'shapefile' | 'macrostrat' | 'wosis'
    label: string
    provenance: {
      provider: 'CSV' | 'GBIF' | 'Macrostrat' | 'Shapefile' | 'WoSIS' | 'Unknown'
      sourceName: string
      importedAt: string
      recordCount: number
      queryLabel: string | null
      queryParams: Record<string, string | number | boolean | null>
      notes: string[]
    }
  },
): ConnectorQueryHistoryEntry {
  return {
    ...entry,
    provenance: {
      ...entry.provenance,
      queryParams: normalizePersistedQueryParams(entry.provenance.queryParams),
    },
  }
}

const connectorFeaturePropertiesSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  category: z
    .enum(['flora', 'fauna', 'biome', 'soil', 'dataset', 'geology'])
    .optional(),
  scientificName: z.string().optional(),
  biome: z.string().optional(),
  municipality: z.string().optional(),
  status: z.enum(['stable', 'attention', 'critical']).optional(),
  summary: z.string().optional(),
  observedAt: z.string().optional(),
  datasetId: z.string(),
  rawAttributes: z.record(z.string(), z.unknown()).optional(),
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
    z.object({
      type: z.literal('LineString'),
      coordinates: z.array(z.tuple([z.number(), z.number()])),
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
      queryParams: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.null()]),
      ),
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
          queryParams: z.record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.null()]),
          ),
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
            normalizePersistedConnectorDataset(dataset),
          ),
          recentQueries:
            parsed.data.recentQueries?.map((entry) =>
              normalizePersistedRecentQuery(entry),
            ) ?? [],
        }
      },
    },
  ),
)
