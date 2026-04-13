import { create } from 'zustand'

export interface LayerPresentationState {
  visibilityById: Record<string, boolean>
  opacityById: Record<string, number>
  replacePresentation: (input: {
    opacityById: Record<string, number>
    visibilityById: Record<string, boolean>
  }) => void
  setLayerVisibility: (layerId: string, isVisible: boolean) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
}

export const useLayerPresentationStore = create<LayerPresentationState>(
  (set) => ({
    visibilityById: {},
    opacityById: {},
    replacePresentation: ({ opacityById, visibilityById }) =>
      set({
        opacityById,
        visibilityById,
      }),
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
