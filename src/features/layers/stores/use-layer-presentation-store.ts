import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface LayerPresentationState {
  visibilityById: Record<string, boolean>
  opacityById: Record<string, number>
  resetPresentation: () => void
  replacePresentation: (input: {
    opacityById: Record<string, number>
    visibilityById: Record<string, boolean>
  }) => void
  setLayerVisibility: (layerId: string, isVisible: boolean) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
}

export const useLayerPresentationStore = create<LayerPresentationState>()(
  persist(
    (set) => ({
      visibilityById: {},
      opacityById: {},
      resetPresentation: () =>
        set({
          opacityById: {},
          visibilityById: {},
        }),
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
    {
      name: 'bgsr-layer-presentation',
      partialize: (state) => ({
        opacityById: state.opacityById,
        visibilityById: state.visibilityById,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
