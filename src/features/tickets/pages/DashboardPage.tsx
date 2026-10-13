import type { LucideIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { AlarmClock, ArrowRight, Hourglass, Inbox, MessageSquareWarning, UserX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { ExpiryCountdown } from "@/features/tickets/components/TicketMeta"
import { BOARD_COLUMNS, TICKET_PRODUCT_MODULES } from "@/features/tickets/constants/ticket.constants"
import { useTicketList, useTicketStats } from "@/features/tickets/hooks/useTicketQueries"
import type { TicketStats } from "@/features/tickets/types/ticket.types"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/shared/components/ErrorState"
import { PageHeader } from "@/shared/components/PageHeader"

type Tile = { key: string; value: number; icon: LucideIcon; tone?: "warning" | "critical"; to?: Record<string, string> }

const StatTile = ({ label, value, icon: Icon, tone, to }: { label: string; value: number; icon: LucideIcon; tone?: Tile["tone"]; to?: Tile["to"] }) => {
  const body = (
    <>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon
          aria-hidden="true"
          className={cn("size-4", tone === "warning" && "text-warning", tone === "critical" && "text-destructive")}
        />
        {label}
      </span>
      <span className="font-display text-3xl font-semibold tabular-nums text-foreground">{value}</span>
    </>
  )
  const className =
    "flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors duration-150"
  return to ? (
    <Link to="/tickets" search={to} className={cn(className, "cursor-pointer hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** Single-series bar list: one hue, value printed beside every bar, label in text ink. */
const BarList = ({ title, rows }: { title: string; rows: Array<{ key: string; label: string; value: number }> }) => {
  const { t } = useTranslation("tickets")
  const max = Math.max(1, ...rows.map((row) => row.value))
  const visible = rows.filter((row) => row.value > 0)
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.no_data")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((row) => (
            <li key={row.key} className="grid grid-cols-[8.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm" title={`${row.label}: ${row.value}`}>
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
              </span>
              <span className="text-right font-medium tabular-nums text-foreground">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const tilesOf = (stats: TicketStats): Tile[] => [
  { key: "open", value: stats.byStatus.OPEN ?? 0, icon: Inbox, to: { status: "OPEN" } },
  { key: "unassigned", value: stats.unassigned, icon: UserX, to: { assignee: "none" } },
  { key: "expiring", value: stats.expiringSoon, icon: AlarmClock, tone: stats.expiringSoon > 0 ? "critical" : undefined, to: { status: "OPEN", assignee: "none" } },
  { key: "waiting_user", value: stats.byStatus.WAITING_FOR_USER ?? 0, icon: MessageSquareWarning, to: { status: "WAITING_FOR_USER" } },
  { key: "expired", value: stats.expiredLast7Days, icon: Hourglass, tone: stats.expiredLast7Days > 0 ? "warning" : undefined },
]

/** Unhandled OPEN tickets closest to their 48h deadline. */
const ExpiringSoon = () => {
  const { t } = useTranslation("tickets")
  const list = useTicketList({ status: "OPEN", assignee: "none", limit: 5 })
  const tickets = list.data?.data ?? []
  return (
    <section aria-labelledby="expiring-heading" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 id="expiring-heading" className="text-sm font-semibold text-foreground">
          {t("dashboard.expiring_title")}
        </h2>
        <Link to="/tickets" search={{ status: "OPEN", assignee: "none" }} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("dashboard.see_queue")}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      {list.isPending ? <Skeleton className="h-24" /> : null}
      {!list.isPending && tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.expiring_empty")}</p>
      ) : null}
      <ul className="divide-y divide-border">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              to="/tickets/$ticketId"
              params={{ ticketId: ticket.id }}
              className="flex min-h-11 items-center gap-3 py-2 text-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
              <span className="min-w-0 flex-1 truncate">{ticket.subject}</span>
              <ExpiryCountdown ticket={ticket} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const DashboardPage = () => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const stats = useTicketStats()

  return (
    <>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />
      {stats.isError ? (
        <ErrorState message={apiErrorMessage(stats.error, tAll)} onRetry={() => void stats.refetch()} retrying={stats.isFetching} />
      ) : stats.isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {tilesOf(stats.data).map((tile) => (
              <StatTile key={tile.key} label={t(`dashboard.tiles.${tile.key}`)} value={tile.value} icon={tile.icon} tone={tile.tone} to={tile.to} />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarList
              title={t("dashboard.by_status")}
              rows={BOARD_COLUMNS.map((status) => ({ key: status, label: t(`status.${status}`), value: stats.data.byStatus[status] ?? 0 }))}
            />
            <BarList
              title={t("dashboard.by_module")}
              rows={TICKET_PRODUCT_MODULES.map((module) => ({ key: module, label: t(`module.${module}`), value: stats.data.byProductModule[module] ?? 0 }))
                .sort((a, b) => b.value - a.value)}
            />
          </div>
        </>
      )}
      <ExpiringSoon />
    </>
  )
}

export { DashboardPage }
