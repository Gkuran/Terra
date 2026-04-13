import { create } from 'zustand'

import type { MapSelection } from '@/features/map/types/map-selection'

type MapTool = 'inspect' | 'bbox'

interface MapUiState {
  activeTool: MapTool
  selection: MapSelection | null
  environmentalProbeCoordinates: [number, number] | null
  focusCoordinates: [number, number] | null
  hoveredFeatureId: string | null
  setActiveTool: (tool: MapTool) => void
  setEnvironmentalProbeCoordinates: (coordinates: [number, number] | null) => void
  setFocusCoordinates: (coordinates: [number, number] | null) => void
  setSelection: (selection: MapSelection | null) => void
  setHoveredFeatureId: (featureId: string | null) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  activeTool: 'inspect',
  selection: null,
  environmentalProbeCoordinates: null,
  focusCoordinates: null,
  hoveredFeatureId: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setEnvironmentalProbeCoordinates: (coordinates) =>
    set({ environmentalProbeCoordinates: coordinates }),
  setFocusCoordinates: (coordinates) => set({ focusCoordinates: coordinates }),
  setSelection: (selection) => set({ selection }),
  setHoveredFeatureId: (featureId) => set({ hoveredFeatureId: featureId }),
}))
