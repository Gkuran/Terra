import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'boulder-ui'

import type { OnboardingStep } from '@/features/onboarding/types/onboarding-step'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './onboarding-tour.css'

interface HighlightRect {
  height: number
  left: number
  top: number
  width: number
}

interface CardPosition {
  left: number
  top: number
}

interface OnboardingTourProps {
  currentStepIndex: number
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  steps: OnboardingStep[]
}

function buildCardPosition(rect: HighlightRect | null): CardPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const cardWidth = Math.min(352, viewportWidth - 24)
  const gap = 18

  if (!rect) {
    return {
      left: Math.max(12, (viewportWidth - cardWidth) / 2),
      top: Math.max(88, (viewportHeight - 220) / 2),
    }
  }

  const preferredBelowTop = rect.top + rect.height + gap
  const preferredAboveTop = rect.top - 232
  const resolvedTop =
    preferredBelowTop + 220 <= viewportHeight - 16
      ? preferredBelowTop
      : Math.max(88, preferredAboveTop)
  const centeredLeft = rect.left + rect.width / 2 - cardWidth / 2

  return {
    left: Math.min(Math.max(12, centeredLeft), viewportWidth - cardWidth - 12),
    top: resolvedTop,
  }
}

export function OnboardingTour({
  currentStepIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  steps,
}: OnboardingTourProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const currentStep = steps[currentStepIndex] ?? null

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setHighlightRect(null)
      return
    }

    const targetElement = document.querySelector(currentStep.target)

    if (!(targetElement instanceof HTMLElement)) {
      setHighlightRect(null)
      return
    }

    targetElement.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: 'smooth',
    })

    const updateRect = () => {
      const targetBounds = targetElement.getBoundingClientRect()

      setHighlightRect({
        top: Math.max(8, targetBounds.top - 8),
        left: Math.max(8, targetBounds.left - 8),
        width: targetBounds.width + 16,
        height: targetBounds.height + 16,
      })
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [currentStep, isOpen])

  const cardPosition = useMemo(
    () => buildCardPosition(highlightRect),
    [highlightRect],
  )

  if (!isOpen || !currentStep) {
    return null
  }

  return (
    <div
      aria-live="polite"
      aria-modal="true"
      className="onboarding-tour"
      role="dialog"
    >
      <div className="onboarding-tour__backdrop" onClick={onClose} />
      {highlightRect ? (
        <div
          aria-hidden="true"
          className="onboarding-tour__highlight"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
          }}
        />
      ) : null}
      <Card
        className="onboarding-tour__card"
        style={{
          left: `${cardPosition.left}px`,
          top: `${cardPosition.top}px`,
        }}
        variant="glass"
      >
        <CardHeader>
          <div className="onboarding-tour__counter">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          <CardTitle as="h3">{currentStep.title}</CardTitle>
        </CardHeader>
        <CardContent className="onboarding-tour__content">
          <p className="onboarding-tour__description">{currentStep.description}</p>
          <div className="onboarding-tour__actions">
            <AppButton onClick={onClose} variant="secondary">
              Close
            </AppButton>
            <div className="onboarding-tour__nav">
              <AppButton
                disabled={currentStepIndex === 0}
                onClick={onPrevious}
                variant="secondary"
              >
                Back
              </AppButton>
              <AppButton onClick={onNext} variant="primary">
                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              </AppButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
