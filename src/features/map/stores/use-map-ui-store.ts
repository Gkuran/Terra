import { create } from 'zustand'

import type { MapSelection } from '@/features/map/types/map-selection'

type MapTool = 'inspect' | 'pan' | 'bbox'

interface MapUiState {
  activeTool: MapTool
  selection: MapSelection | null
  environmentalProbeCoordinates: [number, number] | null
  hoveredFeatureId: string | null
  isInspectorOpen: boolean
  setActiveTool: (tool: MapTool) => void
  setEnvironmentalProbeCoordinates: (coordinates: [number, number] | null) => void
  setSelection: (selection: MapSelection | null) => void
  setHoveredFeatureId: (featureId: string | null) => void
  setInspectorOpen: (isOpen: boolean) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  activeTool: 'inspect',
  selection: null,
  environmentalProbeCoordinates: null,
  hoveredFeatureId: null,
  isInspectorOpen: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setEnvironmentalProbeCoordinates: (coordinates) =>
    set({ environmentalProbeCoordinates: coordinates }),
  setSelection: (selection) => set({ selection }),
  setHoveredFeatureId: (featureId) => set({ hoveredFeatureId: featureId }),
  setInspectorOpen: (isOpen) => set({ isInspectorOpen: isOpen }),
}))
