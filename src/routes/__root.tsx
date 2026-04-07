import { Outlet, createRootRoute } from '@tanstack/react-router'

export const rootRoute = createRootRoute({
  component: RootRoute,
})

function RootRoute() {
  return <Outlet />
}
