export interface OnboardingStep {
  action?: 'open-connectors' | 'open-layers' | 'open-settings'
  allowBackgroundInteraction?: boolean
  description: string
  id: string
  imageAlt?: string
  imageUrl?: string
  nextLabel?: string
  placement?: 'default' | 'modal-side' | 'side-left'
  target: string
  title: string
}
