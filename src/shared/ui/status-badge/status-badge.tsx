import { Badge } from 'boulder-ui'

type BadgeTone = 'stable' | 'attention' | 'critical' | 'ready' | 'processing'

interface StatusBadgeProps {
  tone: BadgeTone
  label: string
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  const variant =
    tone === 'stable' || tone === 'ready'
      ? 'success'
      : tone === 'attention' || tone === 'processing'
        ? 'warning'
        : 'danger'

  return <Badge variant={variant}>{label}</Badge>
}
