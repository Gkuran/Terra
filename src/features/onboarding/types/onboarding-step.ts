export interface OnboardingStep {
  action?: 'open-connectors' | 'open-layers' | 'open-settings'
  description: string
  id: string
  target: string
  title: string
}
