import { create } from 'zustand'

interface OnboardingState {
  currentStepIndex: number
  hasCompletedTour: boolean
  isOpen: boolean
  closeTour: () => void
  completeTour: () => void
  goToNextStep: (stepCount: number) => void
  goToPreviousStep: () => void
  startTour: () => void
}

const onboardingStorageKey = 'bgsr-onboarding-state'

function readStoredCompletion() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const rawValue = window.localStorage.getItem(onboardingStorageKey)
    return rawValue === 'completed'
  } catch {
    return false
  }
}

function persistCompletion(hasCompletedTour: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      onboardingStorageKey,
      hasCompletedTour ? 'completed' : 'incomplete',
    )
  } catch {
    return
  }
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStepIndex: 0,
  hasCompletedTour: readStoredCompletion(),
  isOpen: false,
  closeTour: () => set({ isOpen: false }),
  completeTour: () => {
    persistCompletion(true)
    set({
      currentStepIndex: 0,
      hasCompletedTour: true,
      isOpen: false,
    })
  },
  goToNextStep: (stepCount) =>
    set((state) => {
      const nextIndex = state.currentStepIndex + 1

      if (nextIndex >= stepCount) {
        persistCompletion(true)
        return {
          currentStepIndex: 0,
          hasCompletedTour: true,
          isOpen: false,
        }
      }

      return {
        currentStepIndex: nextIndex,
      }
    }),
  goToPreviousStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    })),
  startTour: () =>
    set({
      currentStepIndex: 0,
      isOpen: true,
    }),
}))
