import { useEffect, useMemo, useRef, useState } from 'react'
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

interface CardSize {
  height: number
  width: number
}

const HIGHLIGHT_RADIUS = 16
const OVERLAY_MASK_ID = 'onboarding-tour-overlay-mask'

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
  cardSize: CardSize,
  placement: OnboardingStep['placement'] = 'default',
): CardPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const cardWidth = Math.min(cardSize.width, viewportWidth - 24)
  const cardHeight = cardSize.height
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

  if (placement === 'side-left') {
    const sideGap = 20
    const centeredTop = Math.min(
      Math.max(88, rect.top + rect.height / 2 - cardHeight / 2),
      viewportHeight - cardHeight - 16,
    )
    const preferredLeft = rect.left - cardWidth - sideGap

    if (preferredLeft >= 12) {
      return {
        left: preferredLeft,
        top: centeredTop,
      }
    }

    const fallbackRight = rect.left + rect.width + sideGap

    if (fallbackRight + cardWidth <= viewportWidth - 12) {
      return {
        left: fallbackRight,
        top: centeredTop,
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
  const [cardSize, setCardSize] = useState<CardSize>({ height: 238, width: 360 })
  const cardRef = useRef<HTMLDivElement | null>(null)
  const currentStep = steps[currentStepIndex] ?? null
  const isModalSideStep = currentStep?.placement === 'modal-side'
  const isMaskPassive = isModalSideStep || currentStep?.allowBackgroundInteraction === true

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setHighlightRect(null)
      return
    }

    let animationFrameId = 0
    let mutationObserver: MutationObserver | null = null
    let targetResizeObserver: ResizeObserver | null = null
    let activeTargetElement: HTMLElement | null = null

    const updateRect = () => {
      if (!activeTargetElement) {
        return
      }

      const targetBounds = activeTargetElement.getBoundingClientRect()
      const rectTop = Math.max(8, targetBounds.top - 8)
      let rectBottom = targetBounds.bottom + 8

      if (currentStep.id === 'query-results') {
        const footerElement = document.querySelector('.terra-footer')

        if (footerElement instanceof HTMLElement) {
          rectBottom = Math.min(rectBottom, footerElement.getBoundingClientRect().top - 8)
        }
      }

      setHighlightRect({
        top: rectTop,
        left: Math.max(8, targetBounds.left - 8),
        width: targetBounds.width + 16,
        height: Math.max(24, rectBottom - rectTop),
      })
    }

    const bindTarget = (targetElement: HTMLElement) => {
      activeTargetElement = targetElement
      targetElement.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
      })
      updateRect()
      targetResizeObserver = new ResizeObserver(() => {
        updateRect()
      })
      targetResizeObserver.observe(targetElement)
      window.addEventListener('resize', updateRect)
      window.addEventListener('scroll', updateRect, true)
    }

    const resolveTarget = () => {
      const targetElement = document.querySelector(currentStep.target)

      if (!(targetElement instanceof HTMLElement)) {
        return false
      }

      bindTarget(targetElement)
      return true
    }

    if (!resolveTarget()) {
      setHighlightRect(null)
      mutationObserver = new MutationObserver(() => {
        if (!activeTargetElement && resolveTarget()) {
          mutationObserver?.disconnect()
          mutationObserver = null
        }
      })
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })

      const retryResolveTarget = () => {
        if (!activeTargetElement && !resolveTarget()) {
          animationFrameId = window.requestAnimationFrame(retryResolveTarget)
        }
      }

      animationFrameId = window.requestAnimationFrame(retryResolveTarget)
    }

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }
      mutationObserver?.disconnect()
      targetResizeObserver?.disconnect()
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [currentStep, isOpen])

  useEffect(() => {
    if (!isOpen || !cardRef.current) {
      return
    }

    const cardElement = cardRef.current
    const updateCardSize = () => {
      const bounds = cardElement.getBoundingClientRect()

      setCardSize({
        height: Math.ceil(bounds.height),
        width: Math.ceil(bounds.width),
      })
    }

    updateCardSize()

    const observer = new ResizeObserver(() => {
      updateCardSize()
    })

    observer.observe(cardElement)

    return () => {
      observer.disconnect()
    }
  }, [currentStep, disabledNextHint, isNextDisabled, isOpen])

  const cardPosition = useMemo(
    () => buildCardPosition(highlightRect, cardSize, currentStep?.placement),
    [cardSize, currentStep?.placement, highlightRect],
  )
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

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
        className={`onboarding-tour__mask${isMaskPassive ? ' onboarding-tour__mask--passive' : ''}`}
        height="100%"
        onClick={isMaskPassive ? undefined : onClose}
        preserveAspectRatio="none"
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        width="100%"
      >
        <defs>
          <mask id={OVERLAY_MASK_ID}>
            <rect fill="white" height={viewportHeight} width={viewportWidth} x="0" y="0" />
            {highlightRect ? (
              <rect
                fill="black"
                height={highlightRect.height}
                rx={HIGHLIGHT_RADIUS}
                ry={HIGHLIGHT_RADIUS}
                width={highlightRect.width}
                x={highlightRect.left}
                y={highlightRect.top}
              />
            ) : null}
          </mask>
        </defs>
        <rect
          className="onboarding-tour__mask-path"
          height={viewportHeight}
          mask={`url(#${OVERLAY_MASK_ID})`}
          width={viewportWidth}
          x="0"
          y="0"
        />
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
        ref={cardRef}
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
