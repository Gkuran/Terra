import { create } from 'zustand'

import type { MapSelection } from '@/features/map/types/map-selection'

type MapTool = 'inspect' | 'pan' | 'bbox'

interface MapUiState {
  activeTool: MapTool
  selection: MapSelection | null
  hoveredFeatureId: string | null
  isInspectorOpen: boolean
  setActiveTool: (tool: MapTool) => void
  setSelection: (selection: MapSelection | null) => void
  setHoveredFeatureId: (featureId: string | null) => void
  setInspectorOpen: (isOpen: boolean) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  activeTool: 'inspect',
  selection: null,
  hoveredFeatureId: null,
  isInspectorOpen: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelection: (selection) => set({ selection }),
  setHoveredFeatureId: (featureId) => set({ hoveredFeatureId: featureId }),
  setInspectorOpen: (isOpen) => set({ isInspectorOpen: isOpen }),
}))
