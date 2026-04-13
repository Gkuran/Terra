import { create } from 'zustand'

interface OnboardingState {
  currentStepIndex: number
  hasCompletedTour: boolean
  hasSeenTour: boolean
  isOpen: boolean
  closeTour: () => void
  completeTour: () => void
  goToNextStep: (stepCount: number) => void
  markTourSeen: () => void
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

function readStoredSeenState() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(onboardingStorageKey) !== null
  } catch {
    return false
  }
}

function persistTourState(state: 'completed' | 'seen') {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(onboardingStorageKey, state)
  } catch {
    return
  }
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStepIndex: 0,
  hasCompletedTour: readStoredCompletion(),
  hasSeenTour: readStoredSeenState(),
  isOpen: false,
  closeTour: () => set({ isOpen: false }),
  completeTour: () => {
    persistTourState('completed')
    set({
      currentStepIndex: 0,
      hasCompletedTour: true,
      hasSeenTour: true,
      isOpen: false,
    })
  },
  goToNextStep: (stepCount) =>
    set((state) => {
      const nextIndex = state.currentStepIndex + 1

      if (nextIndex >= stepCount) {
        persistTourState('completed')
        return {
          currentStepIndex: 0,
          hasCompletedTour: true,
          hasSeenTour: true,
          isOpen: false,
        }
      }

      return {
        currentStepIndex: nextIndex,
      }
    }),
  markTourSeen: () => {
    persistTourState('seen')
    set({
      hasSeenTour: true,
    })
  },
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
