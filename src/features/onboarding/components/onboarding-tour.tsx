import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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

const HIGHLIGHT_RADIUS = 16

interface OnboardingTourProps {
  currentStepIndex: number
  disabledNextHint?: string | null
  isOpen: boolean
  isNextDisabled?: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  steps: OnboardingStep[]
}

function buildCardPosition(
  rect: HighlightRect | null,
  placement: OnboardingStep['placement'] = 'default',
): CardPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const cardWidth = Math.min(360, viewportWidth - 24)
  const cardHeight = 238
  const gap = 18

  if (!rect) {
    return {
      left: Math.max(12, (viewportWidth - cardWidth) / 2),
      top: Math.max(88, (viewportHeight - cardHeight) / 2),
    }
  }

  if (placement === 'modal-side') {
    const sideGap = 28
    const rectRight = rect.left + rect.width
    const rightDockLeft = viewportWidth - cardWidth - 20
    const leftDockLeft = 20
    const sideTop = Math.min(
      Math.max(88, rect.top + rect.height / 2 - cardHeight / 2),
      viewportHeight - cardHeight - 16,
    )
    const canDockRight = rightDockLeft >= rectRight + sideGap
    const canDockLeft = leftDockLeft + cardWidth + sideGap <= rect.left

    if (canDockRight) {
      return {
        left: rightDockLeft,
        top: sideTop,
      }
    }

    if (canDockLeft) {
      return {
        left: leftDockLeft,
        top: sideTop,
      }
    }
  }

  const preferredBelowTop = rect.top + rect.height + gap
  const preferredAboveTop = rect.top - (cardHeight + 12)
  const resolvedTop =
    preferredBelowTop + cardHeight <= viewportHeight - 16
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
  disabledNextHint = null,
  isOpen,
  isNextDisabled = false,
  onClose,
  onNext,
  onPrevious,
  steps,
}: OnboardingTourProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const currentStep = steps[currentStepIndex] ?? null
  const isModalSideStep = currentStep?.placement === 'modal-side'

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
    () => buildCardPosition(highlightRect, currentStep?.placement),
    [currentStep?.placement, highlightRect],
  )
  const overlayPath = useMemo(() => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (!highlightRect) {
      return `M0 0H${viewportWidth}V${viewportHeight}H0Z`
    }

    const left = highlightRect.left
    const top = highlightRect.top
    const right = highlightRect.left + highlightRect.width
    const bottom = highlightRect.top + highlightRect.height

    return [
      `M0 0H${viewportWidth}V${viewportHeight}H0Z`,
      `M${left + HIGHLIGHT_RADIUS} ${top}`,
      `H${right - HIGHLIGHT_RADIUS}`,
      `Q${right} ${top} ${right} ${top + HIGHLIGHT_RADIUS}`,
      `V${bottom - HIGHLIGHT_RADIUS}`,
      `Q${right} ${bottom} ${right - HIGHLIGHT_RADIUS} ${bottom}`,
      `H${left + HIGHLIGHT_RADIUS}`,
      `Q${left} ${bottom} ${left} ${bottom - HIGHLIGHT_RADIUS}`,
      `V${top + HIGHLIGHT_RADIUS}`,
      `Q${left} ${top} ${left + HIGHLIGHT_RADIUS} ${top}`,
      'Z',
    ].join(' ')
  }, [highlightRect])

  if (!isOpen || !currentStep) {
    return null
  }

  return createPortal(
    <div
      aria-live="polite"
      aria-modal="true"
      className="onboarding-tour"
      role="dialog"
    >
      <svg
        aria-hidden="true"
        className={`onboarding-tour__mask${isModalSideStep ? ' onboarding-tour__mask--passive' : ''}`}
        onClick={isModalSideStep ? undefined : onClose}
        preserveAspectRatio="none"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      >
        <path className="onboarding-tour__mask-path" d={overlayPath} fillRule="evenodd" />
      </svg>
      {highlightRect ? (
        <div
          aria-hidden="true"
          className="onboarding-tour__highlight"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
            borderRadius: `${HIGHLIGHT_RADIUS}px`,
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
          {currentStep.imageUrl ? (
            <figure className="onboarding-tour__media">
              <img
                alt={currentStep.imageAlt ?? currentStep.title}
                className="onboarding-tour__media-image"
                src={currentStep.imageUrl}
              />
            </figure>
          ) : null}
          {isNextDisabled && disabledNextHint ? (
            <p className="onboarding-tour__hint">{disabledNextHint}</p>
          ) : null}
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
              <AppButton disabled={isNextDisabled} onClick={onNext} variant="primary">
                {currentStep.nextLabel ??
                  (currentStepIndex === steps.length - 1 ? 'Finish' : 'Next')}
              </AppButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body,
  )
}
