import type { MouseEvent } from "react"

import { Link, useNavigate } from "@tanstack/react-router"
import { MessageCircleReply } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  PriorityIndicator,
  ProductModuleBadge,
  SourceIcon,
  StatusBadge,
} from "@/features/tickets/components/TicketBadges"
import { ParticipantAvatars } from "@/features/tickets/components/ParticipantAvatars"
import { ExpiryCountdown, RelativeTime, UserAvatar } from "@/features/tickets/components/TicketMeta"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { cn } from "@/lib/utils"

/** The opening message also sets `lastMessageBy = REQUESTER`; only a later message counts as a reply. */
const OPENING_MESSAGE_SLACK_MS = 5_000

const customerReplied = (ticket: Ticket) =>
  ticket.lastMessageBy === "REQUESTER" &&
  Boolean(ticket.firstHandledAt) &&
  Boolean(ticket.lastMessageAt) &&
  new Date(ticket.lastMessageAt as string).getTime() - new Date(ticket.createdAt).getTime() > OPENING_MESSAGE_SLACK_MS

const CustomerRepliedBadge = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  if (!customerReplied(ticket)) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary" title={t("queue.customer_replied")}>
      <MessageCircleReply aria-hidden="true" className="size-3.5" />
      <span className="sr-only sm:not-sr-only">{t("queue.customer_replied")}</span>
    </span>
  )
}

const Assignee = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  if (!ticket.assignee) {
    return <span className="text-xs text-muted-foreground">{t("queue.unassigned")}</span>
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <UserAvatar user={ticket.assignee} size="xs" />
      <span className="truncate text-sm">{ticket.assignee.fullName || ticket.assignee.email}</span>
    </span>
  )
}

/**
 * Queue table (≥ md) and stacked cards (< md). Rows stay links to the detail page so
 * keyboard and middle-click work; the subject is the accessible link text.
 */
const TicketTable = ({ tickets }: { tickets: Ticket[] }) => {
  const { t } = useTranslation("tickets")
  const navigate = useNavigate()

  // The whole row opens the ticket; the subject link stays for keyboard, middle-click
  // and "open in new tab". Clicks on links/buttons inside the row keep their own action.
  const openRow = (event: MouseEvent<HTMLTableRowElement>, ticketId: string) => {
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return
    if (window.getSelection()?.toString()) return // the user is selecting text
    if (event.ctrlKey || event.metaKey) {
      window.open(`/tickets/${encodeURIComponent(ticketId)}`, "_blank", "noopener")
      return
    }
    void navigate({ to: "/tickets/$ticketId", params: { ticketId } })
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">{t("queue.title")}</caption>
          <thead className="border-b border-border bg-muted/60 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="w-[44%] px-4 py-3">{t("fields.subject")}</th>
              <th scope="col" className="w-[13%] px-3 py-3">{t("fields.status")}</th>
              <th scope="col" className="w-[11%] px-3 py-3">{t("fields.priority")}</th>
              <th scope="col" className="w-[18%] px-3 py-3">{t("fields.assignee")}</th>
              <th scope="col" className="w-[14%] px-3 py-3">{t("fields.updated")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={(event) => openRow(event, ticket.id)}
                className="group cursor-pointer transition-colors duration-150 hover:bg-muted/50"
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{ticket.ticketNumber}</span>
                    <SourceIcon source={ticket.source} />
                    <ProductModuleBadge module={ticket.productModule} />
                    <ExpiryCountdown ticket={ticket} />
                  </div>
                  <Link
                    to="/tickets/$ticketId"
                    params={{ ticketId: ticket.id }}
                    className="mt-1 line-clamp-2 cursor-pointer font-medium text-foreground hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {ticket.subject}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{ticket.requester?.fullName || ticket.requester?.email}</span>
                    <CustomerRepliedBadge ticket={ticket} />
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-3 py-3 align-top">
                  <PriorityIndicator priority={ticket.priority} />
                </td>
                <td className="px-3 py-3 align-top">
                  <Assignee ticket={ticket} />
                  <ParticipantAvatars participants={ticket.participants} className="mt-1.5" />
                </td>
                <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                  <RelativeTime iso={ticket.updatedAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              to="/tickets/$ticketId"
              params={{ ticketId: ticket.id }}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{ticket.ticketNumber}</span>
                <StatusBadge status={ticket.status} />
                <ExpiryCountdown ticket={ticket} />
              </div>
              <span className="line-clamp-2 font-medium text-foreground">{ticket.subject}</span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <PriorityIndicator priority={ticket.priority} />
                <ProductModuleBadge module={ticket.productModule} />
                <CustomerRepliedBadge ticket={ticket} />
                <span className="ml-auto flex items-center gap-2">
                  <ParticipantAvatars participants={ticket.participants} max={2} />
                  <RelativeTime iso={ticket.updatedAt} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export { Assignee, CustomerRepliedBadge, TicketTable }
