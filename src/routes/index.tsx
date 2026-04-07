import { createRoute } from '@tanstack/react-router'

import { rootRoute } from '@/routes/__root'

function IndexRouteComponent() {
  return null
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRouteComponent,
})
