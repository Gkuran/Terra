import type { HTMLAttributes, PropsWithChildren } from 'react'
import { Card, CardContent } from 'boulder-ui'

import { cn } from '@/shared/lib/utils/cn'

interface FloatingPanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'aside' | 'div'
}

export function FloatingPanel({
  as = 'section',
  children,
  className,
  ...props
}: PropsWithChildren<FloatingPanelProps>) {
  const Component = as

  return (
    <Component {...props}>
      <Card className={cn('floating-panel', className)} variant="glass">
        <CardContent padding="md">{children}</CardContent>
      </Card>
    </Component>
  )
}
