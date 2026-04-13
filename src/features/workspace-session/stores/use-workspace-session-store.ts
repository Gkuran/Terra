import type { StorageValue } from 'zustand/middleware'
import type { FeatureCollection, Geometry } from 'geojson'
import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
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
  includeGbifInAreaQuery: z.boolean(),
  includeMacrostratInAreaQuery: z.boolean(),
  isClimbingModeEnabled: z.boolean().optional(),
  isResultsCollapsed: z.boolean(),
  isStartCardDismissed: z.boolean(),
})

const safeLocalStorageStateStorage: StateStorage = {
  getItem: (name) => window.localStorage.getItem(name),
  removeItem: (name) => window.localStorage.removeItem(name),
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        console.warn(`Skipping persisted workspace write for "${name}" because localStorage quota was exceeded.`)
        return
      }

      throw error
    }
  },
}

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
  isClimbingModeEnabled: boolean
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
  setIsClimbingModeEnabled: (value: boolean) => void
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
      isClimbingModeEnabled: false,
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
      setIsClimbingModeEnabled: (isClimbingModeEnabled) => set({ isClimbingModeEnabled }),
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
        includeGbifInAreaQuery: state.includeGbifInAreaQuery,
        includeMacrostratInAreaQuery: state.includeMacrostratInAreaQuery,
        isClimbingModeEnabled: state.isClimbingModeEnabled,
        isResultsCollapsed: state.isResultsCollapsed,
        isStartCardDismissed: state.isStartCardDismissed,
      }),
      storage: createJSONStorage(() => safeLocalStorageStateStorage),
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
        }
      },
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
)
