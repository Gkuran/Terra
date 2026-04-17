import { Card, CardContent, CardHeader, CardTitle } from 'boulder-ui'

import type { OnboardingStep } from '@/features/onboarding/types/onboarding-step'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './onboarding-inline-step.css'

interface OnboardingInlineStepProps {
  currentStep: OnboardingStep
  currentStepIndex: number
  disabledNextHint?: string | null
  isNextDisabled?: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  stepsCount: number
}

export function OnboardingInlineStep({
  currentStep,
  currentStepIndex,
  disabledNextHint = null,
  isNextDisabled = false,
  onClose,
  onNext,
  onPrevious,
  stepsCount,
}: OnboardingInlineStepProps) {
  return (
    <Card className="onboarding-inline-step" variant="glass">
      <CardHeader>
        <div className="onboarding-inline-step__counter">
          Step {currentStepIndex + 1} of {stepsCount}
        </div>
        <CardTitle as="h3">{currentStep.title}</CardTitle>
      </CardHeader>
      <CardContent className="onboarding-inline-step__content">
        <p className="onboarding-inline-step__description">{currentStep.description}</p>
        {currentStep.imageUrl ? (
          <figure className="onboarding-inline-step__media">
            <img
              alt={currentStep.imageAlt ?? currentStep.title}
              className="onboarding-inline-step__media-image"
              src={currentStep.imageUrl}
            />
          </figure>
        ) : null}
        {isNextDisabled && disabledNextHint ? (
          <p className="onboarding-inline-step__hint">{disabledNextHint}</p>
        ) : null}
        <div className="onboarding-inline-step__actions">
          <AppButton onClick={onClose} variant="secondary">
            Close
          </AppButton>
          <div className="onboarding-inline-step__nav">
            <AppButton
              disabled={currentStepIndex === 0}
              onClick={onPrevious}
              variant="secondary"
            >
              Back
            </AppButton>
            <AppButton disabled={isNextDisabled} onClick={onNext} variant="primary">
              {currentStep.nextLabel ??
                (currentStepIndex === stepsCount - 1 ? 'Finish' : 'Next')}
            </AppButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
