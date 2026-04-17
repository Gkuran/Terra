export interface OnboardingStep {
  action?: 'open-connectors' | 'open-layers' | 'open-settings'
  description: string
  id: string
  imageAlt?: string
  imageUrl?: string
  nextLabel?: string
  placement?: 'default' | 'modal-side'
  target: string
  title: string
}
