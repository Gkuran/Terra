import { create } from 'zustand'

export interface AppToast {
  description?: string
  duration: number
  id: string
  title: string
  variant: 'default' | 'success' | 'danger' | 'warning' | 'info'
}

interface ToastStoreState {
  toasts: AppToast[]
  dismissToast: (toastId: string) => void
  pushToast: (toast: Omit<AppToast, 'id' | 'duration'> & { duration?: number }) => void
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          duration: toast.duration ?? 4200,
          id: `toast-${Date.now()}-${Math.round(Math.random() * 10000)}`,
          ...toast,
        },
      ].slice(-4),
    })),
}))
