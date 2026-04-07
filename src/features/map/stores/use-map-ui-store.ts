import { create } from 'zustand'

type MapTool = 'inspect' | 'pan'

interface MapUiState {
  activeTool: MapTool
  selectedFeatureId: string | null
  hoveredFeatureId: string | null
  isInspectorOpen: boolean
  setActiveTool: (tool: MapTool) => void
  setSelectedFeatureId: (featureId: string | null) => void
  setHoveredFeatureId: (featureId: string | null) => void
  setInspectorOpen: (isOpen: boolean) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  activeTool: 'inspect',
  selectedFeatureId: null,
  hoveredFeatureId: null,
  isInspectorOpen: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedFeatureId: (featureId) => set({ selectedFeatureId: featureId }),
  setHoveredFeatureId: (featureId) => set({ hoveredFeatureId: featureId }),
  setInspectorOpen: (isOpen) => set({ isInspectorOpen: isOpen }),
}))
