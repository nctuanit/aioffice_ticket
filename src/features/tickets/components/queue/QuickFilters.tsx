import type { LucideIcon } from "lucide-react"
import { AlarmClock, Check, Eye, MessageCircleReply, UserRound, UserX } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { FilterPatch, TicketListSearch } from "@/features/tickets/types/ticket-search"
import { cn } from "@/lib/utils"

type QuickFilter = {
  key: "unassigned" | "mine" | "watching" | "expiring" | "replied"
  icon: LucideIcon
  isActive: (search: TicketListSearch) => boolean
  on: FilterPatch
  off: FilterPatch
  /** The board shows statuses as columns, so status-based presets only make sense in the list. */
  listOnly?: boolean
  /** Filters the loaded page in the browser instead of asking the API. */
  clientSide?: boolean
}

/**
 * One-click presets over the URL filters. Each toggles only its own keys, so they combine
 * with each other and with the selects in the filter popover. "Expiring soon" relies on the
 * API's default sort (nearest deadline first).
 */
const QUICK_FILTERS: QuickFilter[] = [
  {
    key: "unassigned",
    icon: UserX,
    isActive: (search) => search.assignee === "none",
    on: { assignee: "none" },
    off: { assignee: undefined },
  },
  {
    key: "mine",
    icon: UserRound,
    isActive: (search) => search.assignee === "me",
    on: { assignee: "me" },
    off: { assignee: undefined },
  },
  {
    key: "watching",
    icon: Eye,
    isActive: (search) => search.participant === "me",
    on: { participant: "me" },
    off: { participant: undefined },
  },
  {
    key: "expiring",
    icon: AlarmClock,
    listOnly: true,
    isActive: (search) => search.status === "OPEN" && search.assignee === "none",
    on: { status: "OPEN", assignee: "none" },
    off: { status: undefined, assignee: undefined },
  },
  {
    key: "replied",
    icon: MessageCircleReply,
    clientSide: true,
    isActive: (search) => search.replied === true,
    on: { replied: true },
    off: { replied: undefined },
  },
]

type QuickFiltersProps = {
  search: TicketListSearch
  onChange: (patch: FilterPatch) => void
  view: "list" | "board"
}

/** Toggle chips beside the filter button; `aria-pressed` + check mark show the active ones. */
const QuickFilters = ({ search, onChange, view }: QuickFiltersProps) => {
  const { t } = useTranslation("tickets")

  return (
    // phones: one swipeable row bleeding to the left page edge only, so it stops short of the
    // filter button and never widens the page (padding keeps focus rings visible); wider screens wrap
    <div
      role="group"
      aria-label={t("quick_filters.label")}
      className="-ml-4 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pr-1 pl-4 sm:ml-0 sm:flex-wrap sm:overflow-visible sm:pr-0 sm:pl-0"
    >
      {QUICK_FILTERS.filter((filter) => !filter.listOnly || view === "list").map((filter) => {
        const active = filter.isActive(search)
        const Icon = active ? Check : filter.icon
        return (
          <button
            key={filter.key}
            type="button"
            aria-pressed={active}
            title={t(`quick_filters.${filter.key}_hint`)}
            onClick={() => onChange(active ? filter.off : filter.on)}
            className={cn(
              "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {t(`quick_filters.${filter.key}`)}
            {filter.clientSide ? (
              <span className={cn("text-xs font-normal", active ? "text-primary" : "text-muted-foreground")}>
                · {t("quick_filters.this_page")}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export { QuickFilters }
