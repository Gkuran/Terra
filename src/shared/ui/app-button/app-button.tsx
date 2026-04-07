import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Button } from 'boulder-ui'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
}

export function AppButton({
  children,
  type = 'button',
  variant = 'secondary',
  isLoading,
  ...props
}: PropsWithChildren<AppButtonProps>) {
  const resolvedVariant =
    variant === 'ghost' ? 'secondary' : variant

  return (
    <Button
      {...props}
      isLoading={isLoading}
      size="md"
      type={type}
      variant={resolvedVariant}
    >
      {children}
    </Button>
  )
}
