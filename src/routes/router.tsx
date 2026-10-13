import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { z } from "zod"

import { RootLayout } from "@/app/RootLayout"
import {
  HOME_PATH,
  requireAdminSession,
  requireGuestSession,
  requireStaffSession,
} from "@/features/auth/utils/route-guards"
import { TICKET_STATUSES } from "@/features/tickets/constants/ticket.constants"
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

/** Queue filters live in the URL so a filtered view can be shared and survives reloads. */
const ticketListSearchSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  assignee: z.enum(["me", "none"]).optional(),
  q: z.string().trim().min(1).optional(),
  page: z.number().int().min(1).optional(),
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

type TicketListSearch = z.infer<typeof ticketListSearchSchema>

export { router, ticketListSearchSchema }
export type { TicketListSearch }
