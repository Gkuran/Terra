import { create } from 'zustand'

export interface LayerPresentationState {
  visibilityById: Record<string, boolean>
  opacityById: Record<string, number>
  setLayerVisibility: (layerId: string, isVisible: boolean) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
}

export const useLayerPresentationStore = create<LayerPresentationState>(
  (set) => ({
    visibilityById: {},
    opacityById: {},
    setLayerVisibility: (layerId, isVisible) =>
      set((state) => ({
        visibilityById: {
          ...state.visibilityById,
          [layerId]: isVisible,
        },
      })),
    setLayerOpacity: (layerId, opacity) =>
      set((state) => ({
        opacityById: {
          ...state.opacityById,
          [layerId]: opacity,
        },
      })),
  }),
)
