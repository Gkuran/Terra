import { Modal, ModalContent, ModalHeader, ModalTitle } from 'boulder-ui'

import { AreaQuerySourcesPanel } from '@/features/connectors/components/area-query-sources-panel'
import { OnboardingInlineStep } from '@/features/onboarding/components/onboarding-inline-step'
import type { OnboardingStep } from '@/features/onboarding/types/onboarding-step'

interface AreaQuerySettingsModalProps {
  includeGbif: boolean
  includeMacrostrat: boolean
  isOpen: boolean
  onboardingStep?: OnboardingStep | null
  onboardingStepIndex?: number
  onboardingStepsCount?: number
  onClose: () => void
  onOnboardingClose?: () => void
  onOnboardingNext?: () => void
  onOnboardingPrevious?: () => void
  onToggleGbif: () => void
  onToggleMacrostrat: () => void
}

export function AreaQuerySettingsModal({
  includeGbif,
  includeMacrostrat,
  isOpen,
  onboardingStep = null,
  onboardingStepIndex = 0,
  onboardingStepsCount = 1,
  onClose,
  onOnboardingClose,
  onOnboardingNext,
  onOnboardingPrevious,
  onToggleGbif,
  onToggleMacrostrat,
}: AreaQuerySettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" variant="glass">
      <ModalHeader>
        <ModalTitle>Query settings</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <div data-tour="query-settings-modal">
          {onboardingStep ? (
            <OnboardingInlineStep
              currentStep={onboardingStep}
              currentStepIndex={onboardingStepIndex}
              onClose={onOnboardingClose ?? onClose}
              onNext={onOnboardingNext ?? onClose}
              onPrevious={onOnboardingPrevious ?? onClose}
              stepsCount={onboardingStepsCount}
            />
          ) : null}
          <AreaQuerySourcesPanel
            includeGbif={includeGbif}
            includeMacrostrat={includeMacrostrat}
            onToggleGbif={onToggleGbif}
            onToggleMacrostrat={onToggleMacrostrat}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}
