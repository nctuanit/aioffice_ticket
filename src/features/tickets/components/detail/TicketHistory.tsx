import { History } from "lucide-react"
import { useTranslation } from "react-i18next"

import { RelativeTime } from "@/features/tickets/components/TicketMeta"
import { useAssignees, useTicketEvents } from "@/features/tickets/hooks/useTicketQueries"
import type { TicketEvent, UserSummary } from "@/features/tickets/types/ticket.types"

const str = (value: unknown) => (typeof value === "string" ? value : null)

/** Audit trail of the ticket (status, priority, assignment, first handling, expiry). */
const TicketHistory = ({ ticketId }: { ticketId: string }) => {
  const { t } = useTranslation("tickets")
  const events = useTicketEvents(ticketId)
  const assignees = useAssignees()

  const nameOf = (userId: string | null) => {
    if (!userId) return t("queue.unassigned")
    const user = (assignees.data ?? []).find((item: UserSummary) => item.id === userId)
    return user ? user.fullName || user.email : t("history.someone")
  }

  const describe = (event: TicketEvent) => {
    const before = event.oldValue ?? {}
    const after = event.newValue ?? {}
    switch (event.eventType) {
      case "CREATED":
        return t("history.created")
      case "STATUS_CHANGED":
        return t("history.status", {
          from: t(`status.${str(before.status) ?? "OPEN"}`),
          to: t(`status.${str(after.status) ?? "OPEN"}`),
        })
      case "PRIORITY_CHANGED":
        return t("history.priority", {
          from: t(`priority.${str(before.priority) ?? "NORMAL"}`),
          to: t(`priority.${str(after.priority) ?? "NORMAL"}`),
        })
      case "ASSIGNEE_CHANGED":
        return t("history.assignee", { name: nameOf(str(after.assigneeId)) })
      case "HANDLED":
        return t("history.handled")
      case "EXPIRED":
        return t("history.expired")
      default:
        return event.eventType
    }
  }

  const actorOf = (event: TicketEvent) =>
    event.actorType === "SYSTEM"
      ? t("history.system")
      : event.actor?.fullName || event.actor?.email || t("history.someone")

  const items = events.data?.data ?? []

  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <History aria-hidden="true" className="size-4 text-muted-foreground" />
        {t("detail.history")}
        <span className="ml-auto text-xs font-normal text-muted-foreground">{items.length || ""}</span>
      </summary>
      <ol className="flex flex-col gap-3 border-t border-border px-4 py-3">
        {events.isPending ? <li className="text-sm text-muted-foreground">{t("common:loading")}</li> : null}
        {items.map((event) => (
          <li key={event.id} className="flex flex-col gap-0.5 text-sm">
            <span className="text-foreground">{describe(event)}</span>
            <span className="text-xs text-muted-foreground">
              {actorOf(event)} · <RelativeTime iso={event.createdAt} />
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}

export { TicketHistory }
