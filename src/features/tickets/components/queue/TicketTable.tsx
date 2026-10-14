import type { MouseEvent, ReactNode } from "react"

import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowDown, ArrowUp, ChevronsUpDown, MessageCircleReply } from "lucide-react"
import { useTranslation } from "react-i18next"

import { NativeSelect } from "@/components/ui/native-select"
import {
  PriorityIndicator,
  ProductModuleBadge,
  SourceIcon,
  StatusBadge,
} from "@/features/tickets/components/TicketBadges"
import { ParticipantAvatars } from "@/features/tickets/components/ParticipantAvatars"
import { ExpiryCountdown, RelativeTime, UserAvatar } from "@/features/tickets/components/TicketMeta"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { customerReplied } from "@/features/tickets/utils/ticket-signals"
import {
  nextTicketSort,
  SORT_DIRECTIONS,
  TICKET_SORT_FIELDS,
  type TicketSort,
  type TicketSortField,
} from "@/features/tickets/utils/ticket-sort"
import { cn } from "@/lib/utils"

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

type SortProps = {
  sort: TicketSort
  onSort: (next: TicketSort) => void
}

/** Column header that sorts on click; `aria-sort` tells screen readers the current order. */
const SortableHeader = ({
  field,
  label,
  className,
  sort,
  onSort,
}: SortProps & { field: TicketSortField; label: ReactNode; className?: string }) => {
  const { t } = useTranslation("tickets")
  const active = sort.field === field
  const Icon = !active ? ChevronsUpDown : sort.order === "asc" ? ArrowUp : ArrowDown
  const next = nextTicketSort(sort, field)
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}
      className={cn("py-2", className)}
    >
      <button
        type="button"
        onClick={() => onSort(next)}
        title={t(`sort.options.${next.field}_${next.order}`)}
        className={cn(
          "-mx-2 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 font-medium tracking-wide uppercase transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", !active && "opacity-50")} />
      </button>
    </th>
  )
}

/** Phones have no table header: the same sort as a native select above the cards. */
const MobileSortSelect = ({ sort, onSort }: SortProps) => {
  const { t } = useTranslation("tickets")
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground md:hidden">
      <span className="shrink-0">{t("sort.label")}</span>
      <NativeSelect
        className="flex-1"
        value={`${sort.field}:${sort.order}`}
        onChange={(event) => {
          const [field, order] = event.target.value.split(":") as [TicketSort["field"], TicketSort["order"]]
          onSort({ field, order })
        }}
      >
        {TICKET_SORT_FIELDS.flatMap((field) =>
          SORT_DIRECTIONS.map((order) => (
            <option key={`${field}:${order}`} value={`${field}:${order}`}>
              {t(`sort.options.${field}_${order}`)}
            </option>
          )),
        )}
      </NativeSelect>
    </label>
  )
}

/**
 * Queue table (≥ md) and stacked cards (< md). Rows stay links to the detail page so
 * keyboard and middle-click work; the subject is the accessible link text. Column
 * headers (select on phones) change the server-side sort; the "Ticket" column sorts by
 * creation time, which is also ticket-number order.
 */
const TicketTable = ({ tickets, sort, onSort }: { tickets: Ticket[] } & SortProps) => {
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
              <SortableHeader field="createdAt" label={t("fields.subject")} className="w-[44%] px-4" sort={sort} onSort={onSort} />
              <SortableHeader field="status" label={t("fields.status")} className="w-[13%] px-3" sort={sort} onSort={onSort} />
              <SortableHeader field="priority" label={t("fields.priority")} className="w-[11%] px-3" sort={sort} onSort={onSort} />
              <SortableHeader field="assignee" label={t("fields.assignee")} className="w-[18%] px-3" sort={sort} onSort={onSort} />
              <SortableHeader field="updatedAt" label={t("fields.updated")} className="w-[14%] px-3" sort={sort} onSort={onSort} />
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

      <MobileSortSelect sort={sort} onSort={onSort} />
      <ul className="mt-2 flex flex-col gap-2 md:hidden">
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
