import { Toast } from 'boulder-ui'

import { useToastStore } from '@/shared/ui/app-toast/use-toast-store'

import './app-toast.css'

export function AppToastStack() {
  const dismissToast = useToastStore((state) => state.dismissToast)
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div aria-live="polite" className="app-toast-stack">
      {toasts.map((toast) => (
        <Toast
          description={toast.description}
          duration={toast.duration}
          key={toast.id}
          onClose={() => dismissToast(toast.id)}
          position="bottom-right"
          title={toast.title}
          variant={toast.variant}
        />
      ))}
    </div>
  )
}
