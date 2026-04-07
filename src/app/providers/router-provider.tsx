import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider as TanStackRouterProvider } from '@tanstack/react-router'

import { queryClient } from '@/app/providers/query-client'
import { router } from '@/app/router'

export function RouterProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <TanStackRouterProvider router={router} />
    </QueryClientProvider>
  )
}
