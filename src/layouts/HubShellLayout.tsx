import { useState, type PropsWithChildren } from "react"

import { Link, useNavigate } from "@tanstack/react-router"
import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogoutMutation } from "@/features/auth/hooks/useLogoutMutation"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { LiveIndicator } from "@/features/tickets/components/realtime/LiveIndicator"
import { NotificationOptIn } from "@/features/tickets/components/realtime/NotificationOptIn"
import { TopbarSearch } from "@/features/tickets/components/search/TopbarSearch"
import { ShortcutsHelpDialog } from "@/features/tickets/components/shortcuts/ShortcutsHelpDialog"
import { useGlobalShortcuts } from "@/features/tickets/hooks/useGlobalShortcuts"
import { useTicketStream } from "@/features/tickets/realtime/useTicketStream"
import { useTitleBadge } from "@/features/tickets/realtime/useTitleBadge"
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher"

type NavItem = {
  key: "dashboard" | "queue" | "mine" | "closed" | "calendar"
  to: "/dashboard" | "/tickets" | "/settings/calendar"
  search?: Record<string, string>
  icon: typeof Inbox
  adminOnly?: boolean
  /** `g …` keyboard sequence, shown as a tooltip hint. */
  shortcut?: string
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", to: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { key: "queue", to: "/tickets", icon: Inbox, shortcut: "G Q" },
  { key: "mine", to: "/tickets", search: { assignee: "me" }, icon: UserRound },
  { key: "closed", to: "/tickets", search: { status: "CLOSED" }, icon: CheckCircle2 },
  { key: "calendar", to: "/settings/calendar", icon: CalendarDays, adminOnly: true },
]

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useTranslation("common")
  const role = useAuthStore((state) => state.user?.role)

  return (
    <nav aria-label={t("nav.queue")} className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin").map((item) => (
        <Link
          key={item.key}
          to={item.to}
          search={item.search}
          onClick={onNavigate}
          title={item.shortcut ? t("tickets:shortcuts.with_key", { label: t(`nav.${item.key}`), key: item.shortcut }) : undefined}
          activeOptions={{ exact: item.to === "/tickets", includeSearch: Boolean(item.search) }}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-active hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:bg-sidebar-active data-[status=active]:text-white"
        >
          <item.icon aria-hidden="true" className="size-4 shrink-0" />
          {t(`nav.${item.key}`)}
        </Link>
      ))}
    </nav>
  )
}

const Brand = () => {
  const { t } = useTranslation("common")
  return (
    <div className="flex items-center gap-2.5 px-3">
      <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Inbox aria-hidden="true" className="size-4" />
      </div>
      <span className="font-display text-base font-semibold text-white">{t("app_name")}</span>
    </div>
  )
}

const UserMenu = () => {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()

  const logout = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined)
    await navigate({ to: "/login" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-2" aria-label={t("menu.account")}>
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {(user?.fullName || user?.email || "?").trim().charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-40 truncate text-left text-sm font-medium text-foreground sm:block">
            {user?.fullName || user?.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{user?.fullName}</span>
          <span className="truncate text-xs font-normal text-slate-500">{user?.email}</span>
          {user ? (
            <Badge className="mt-1 w-fit" variant="neutral">
              {tCommon(`role.${user.role}`)}
            </Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onSelect={() => void logout()}>
          <LogOut aria-hidden="true" className="size-4" />
          {t("menu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Console frame: dark sidebar (desktop) / slide-over drawer (mobile), light content area.
 * Pages render inside `<main>` with a consistent max width and padding.
 */
const HubShellLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation("common")
  const { t: tTickets } = useTranslation("tickets")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  // one realtime connection per tab, for as long as the signed-in shell is mounted
  useTicketStream()
  useTitleBadge()
  useGlobalShortcuts({ onHelp: () => setShortcutsOpen(true) })
  const shortcutsLabel = tTickets("shortcuts.with_key", { label: tTickets("shortcuts.title"), key: "?" })

  return (
    // Fixed to the viewport: only <main> scrolls (no second, page-level scrollbar).
    <div className="flex h-svh overflow-hidden bg-background">
      <a
        href="#hub-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        {t("skip_to_content")}
      </a>

      <aside className="hidden w-60 shrink-0 flex-col gap-6 bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <SidebarNav />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 bg-sidebar px-3 py-5 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-white" aria-label={t("close")} onClick={() => setDrawerOpen(false)}>
                <X aria-hidden="true" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("open_menu")} onClick={() => setDrawerOpen(true)}>
            <Menu aria-hidden="true" />
          </Button>
          <TopbarSearch />
          <LiveIndicator />
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-11 sm:inline-flex"
            aria-label={shortcutsLabel}
            title={shortcutsLabel}
            aria-keyshortcuts="?"
            onClick={() => setShortcutsOpen(true)}
          >
            <Keyboard aria-hidden="true" />
          </Button>
          <NotificationOptIn />
          <LanguageSwitcher />
          <UserMenu />
        </header>
        <main id="hub-content" className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <ShortcutsHelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}

export { HubShellLayout }
