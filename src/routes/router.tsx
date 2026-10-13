import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { RootLayout } from "@/app/RootLayout"
import {
  HOME_PATH,
  requireAdminSession,
  requireGuestSession,
  requireStaffSession,
} from "@/features/auth/utils/route-guards"
import { ticketListSearchSchema, type TicketListSearch } from "@/features/tickets/types/ticket-search"
import { AuthLayout, HubShellLayout } from "@/layouts"
import { AppLoadingScreen } from "@/shared/components/AppLoadingScreen"
import { NotFoundPage } from "@/shared/components/NotFoundPage"

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: HOME_PATH })
  },
})

// ---- guest ----
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  beforeLoad: async () => {
    await requireGuestSession()
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/login",
  component: lazyRouteComponent(() => import("@/features/auth"), "LoginPage"),
})

/** Signed in, but not admin / support. Outside the guest group so the session stays. */
const noAccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/no-access",
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
})

const noAccessIndexRoute = createRoute({
  getParentRoute: () => noAccessRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/features/auth"), "NoAccessPage"),
})

// ---- staff console ----
const hubRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "hub",
  beforeLoad: async () => {
    await requireStaffSession()
  },
  component: () => (
    <HubShellLayout>
      <Outlet />
    </HubShellLayout>
  ),
  pendingComponent: AppLoadingScreen,
})

const dashboardRoute = createRoute({
  getParentRoute: () => hubRoute,
  path: "/dashboard",
  component: lazyRouteComponent(() => import("@/features/tickets"), "DashboardPage"),
})

const ticketsRoute = createRoute({
  getParentRoute: () => hubRoute,
  path: "/tickets",
  validateSearch: (search) => ticketListSearchSchema.parse(search),
  component: lazyRouteComponent(() => import("@/features/tickets"), "QueuePage"),
})

const ticketDetailRoute = createRoute({
  getParentRoute: () => hubRoute,
  path: "/tickets/$ticketId",
  component: lazyRouteComponent(() => import("@/features/tickets"), "TicketDetailPage"),
})

const calendarSettingsRoute = createRoute({
  getParentRoute: () => hubRoute,
  path: "/settings/calendar",
  beforeLoad: async () => {
    await requireAdminSession()
  },
  component: lazyRouteComponent(() => import("@/features/tickets"), "CalendarSettingsPage"),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute.addChildren([loginRoute]),
  noAccessRoute.addChildren([noAccessIndexRoute]),
  hubRoute.addChildren([dashboardRoute, ticketsRoute, ticketDetailRoute, calendarSettingsRoute]),
])

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: AppLoadingScreen,
  scrollRestoration: true,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export { router, ticketListSearchSchema }
export type { TicketListSearch }
