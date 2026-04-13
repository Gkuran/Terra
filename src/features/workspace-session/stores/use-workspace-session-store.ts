import type { StorageValue } from 'zustand/middleware'
import type { FeatureCollection, Geometry } from 'geojson'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import type { LayerMetadata } from '@/entities/layer/model/layer-metadata'
import {
  defaultGbifOccurrenceFilters,
  type GbifOccurrenceFilters,
} from '@/features/connectors/lib/gbif-occurrence-filters'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'

const datasetMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['flora', 'fauna', 'biome', 'soil']),
  regionLabel: z.string(),
  featureCount: z.number(),
  updatedAt: z.string(),
  status: z.enum(['ready', 'processing', 'draft']),
  tags: z.array(z.string()),
})

const featurePropertiesSchema = z
  .object({
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
  })
  .catchall(z.unknown())

const featureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.string(),
      }).catchall(z.unknown()),
      properties: featurePropertiesSchema,
    }),
  ),
})

const layerMetadataSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  geometryType: z.enum(['fill', 'line', 'circle']),
  color: z.string(),
  defaultOpacity: z.number(),
  isVisibleByDefault: z.boolean(),
  featureCount: z.number(),
  legendLabel: z.string(),
})

const uploadHistorySchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  featureCount: z.number(),
  importedAt: z.string(),
  status: z.enum(['success', 'error']),
  message: z.string(),
})

const gbifOccurrenceFiltersSchema = z.object({
  includeFlora: z.boolean(),
  includeFauna: z.boolean(),
  requireImage: z.boolean(),
  basisOfRecord: z.string().nullable(),
  country: z.string().nullable(),
  stateProvince: z.string().nullable(),
  yearFrom: z.string(),
  yearTo: z.string(),
})

const persistedWorkspaceSessionSchema = z.object({
  activePanel: z.union([z.literal('layers'), z.null()]),
  gbifOccurrenceFilters: gbifOccurrenceFiltersSchema,
  hasInitialized: z.boolean(),
  includeGbifInAreaQuery: z.boolean(),
  includeMacrostratInAreaQuery: z.boolean(),
  isResultsCollapsed: z.boolean(),
  isStartCardDismissed: z.boolean(),
  sessionDataset: datasetMetadataSchema.nullable(),
  sessionFeatures: featureCollectionSchema.nullable(),
  sessionLayers: z.array(layerMetadataSchema),
  sessionUploadHistory: z.array(uploadHistorySchema),
})

interface InitializeWorkspaceSessionInput {
  dataset: DatasetMetadata
  features: FeatureCollection<Geometry, FeatureProperties>
  layers: LayerMetadata[]
  uploadHistory: UploadResult[]
}

interface WorkspaceSessionState {
  activePanel: 'layers' | null
  gbifOccurrenceFilters: GbifOccurrenceFilters
  hasHydrated: boolean
  hasInitialized: boolean
  includeGbifInAreaQuery: boolean
  includeMacrostratInAreaQuery: boolean
  isResultsCollapsed: boolean
  isStartCardDismissed: boolean
  sessionDataset: DatasetMetadata | null
  sessionFeatures: FeatureCollection<Geometry, FeatureProperties> | null
  sessionLayers: LayerMetadata[]
  sessionUploadHistory: UploadResult[]
  dismissStartCard: () => void
  initializeFromRoute: (input: InitializeWorkspaceSessionInput) => void
  markHydrated: () => void
  setActivePanel: (activePanel: 'layers' | null) => void
  setGbifOccurrenceFilters: (filters: GbifOccurrenceFilters) => void
  setIncludeGbifInAreaQuery: (value: boolean) => void
  setIncludeMacrostratInAreaQuery: (value: boolean) => void
  setIsResultsCollapsed: (value: boolean) => void
  setSessionDataset: (dataset: DatasetMetadata) => void
  setSessionFeatures: (features: FeatureCollection<Geometry, FeatureProperties>) => void
  setSessionLayers: (layers: LayerMetadata[]) => void
  setSessionUploadHistory: (uploadHistory: UploadResult[]) => void
}

export const useWorkspaceSessionStore = create<WorkspaceSessionState>()(
  persist(
    (set) => ({
      activePanel: null,
      gbifOccurrenceFilters: defaultGbifOccurrenceFilters,
      hasHydrated: false,
      hasInitialized: false,
      includeGbifInAreaQuery: true,
      includeMacrostratInAreaQuery: true,
      isResultsCollapsed: true,
      isStartCardDismissed: false,
      sessionDataset: null,
      sessionFeatures: null,
      sessionLayers: [],
      sessionUploadHistory: [],
      dismissStartCard: () => set({ isStartCardDismissed: true }),
      initializeFromRoute: ({ dataset, features, layers, uploadHistory }) =>
        set((state) => {
          if (state.hasInitialized) {
            return state
          }

          return {
            hasInitialized: true,
            sessionDataset: dataset,
            sessionFeatures: features,
            sessionLayers: layers,
            sessionUploadHistory: uploadHistory,
          }
        }),
      markHydrated: () => set({ hasHydrated: true }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setGbifOccurrenceFilters: (gbifOccurrenceFilters) => set({ gbifOccurrenceFilters }),
      setIncludeGbifInAreaQuery: (includeGbifInAreaQuery) => set({ includeGbifInAreaQuery }),
      setIncludeMacrostratInAreaQuery: (includeMacrostratInAreaQuery) =>
        set({ includeMacrostratInAreaQuery }),
      setIsResultsCollapsed: (isResultsCollapsed) => set({ isResultsCollapsed }),
      setSessionDataset: (sessionDataset) => set({ hasInitialized: true, sessionDataset }),
      setSessionFeatures: (sessionFeatures) => set({ hasInitialized: true, sessionFeatures }),
      setSessionLayers: (sessionLayers) => set({ hasInitialized: true, sessionLayers }),
      setSessionUploadHistory: (sessionUploadHistory) =>
        set({ hasInitialized: true, sessionUploadHistory }),
    }),
    {
      name: 'bgsr-workspace-session',
      partialize: (state) => ({
        activePanel: state.activePanel,
        gbifOccurrenceFilters: state.gbifOccurrenceFilters,
        hasHydrated: state.hasHydrated,
        hasInitialized: state.hasInitialized,
        includeGbifInAreaQuery: state.includeGbifInAreaQuery,
        includeMacrostratInAreaQuery: state.includeMacrostratInAreaQuery,
        isResultsCollapsed: state.isResultsCollapsed,
        isStartCardDismissed: state.isStartCardDismissed,
        sessionDataset: state.sessionDataset,
        sessionFeatures: state.sessionFeatures,
        sessionLayers: state.sessionLayers,
        sessionUploadHistory: state.sessionUploadHistory,
      }),
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const parsed = persistedWorkspaceSessionSchema.safeParse(
          (persistedState as StorageValue<unknown> | undefined)?.state,
        )

        if (!parsed.success) {
          return currentState
        }

        return {
          ...currentState,
          ...parsed.data,
          hasHydrated: true,
          sessionFeatures:
            parsed.data.sessionFeatures as FeatureCollection<Geometry, FeatureProperties> | null,
        }
      },
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
)
