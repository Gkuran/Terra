import { RouterProvider } from '@/app/providers/router-provider'
import { AppToastStack } from '@/shared/ui/app-toast'

export function App() {
  return (
    <>
      <RouterProvider />
      <AppToastStack />
    </>
  )
}
