import { useDraggable } from "@dnd-kit/core"
import { ArrowRightLeft, GripVertical, MoreHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FINAL_STATUSES,
  STAFF_TRANSITIONS,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import { ParticipantAvatars } from "@/features/tickets/components/ParticipantAvatars"
import { CustomerRepliedBadge } from "@/features/tickets/components/queue/TicketTable"
import {
  PriorityIndicator,
  ProductModuleBadge,
  SourceIcon,
} from "@/features/tickets/components/TicketBadges"
import { ExpiryCountdown, RelativeTime, UserAvatar } from "@/features/tickets/components/TicketMeta"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { cn } from "@/lib/utils"

type BoardCardBodyProps = {
  ticket: Ticket
  className?: string
}

/** Visual card content, shared by the draggable card and the drag overlay. */
const BoardCardBody = ({ ticket, className }: BoardCardBodyProps) => {
  const { t } = useTranslation("tickets")
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5 pr-14 text-xs text-muted-foreground">
        <span className="font-mono">{ticket.ticketNumber}</span>
        <SourceIcon source={ticket.source} />
        <ExpiryCountdown ticket={ticket} />
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">{ticket.subject}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <ProductModuleBadge module={ticket.productModule} />
        <span className="text-xs text-muted-foreground">{t(`category.${ticket.category}`)}</span>
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <PriorityIndicator priority={ticket.priority} showLabel={false} />
        <CustomerRepliedBadge ticket={ticket} />
        <span className="ml-auto flex items-center gap-2">
          <RelativeTime iso={ticket.updatedAt} />
          <ParticipantAvatars participants={ticket.participants} max={2} />
          {ticket.assignee ? (
            <UserAvatar user={ticket.assignee} size="xs" />
          ) : (
            <span
              className="grid size-6 place-items-center rounded-full border border-dashed border-border-strong text-xs"
              title={t("queue.unassigned")}
            >
              <span className="sr-only">{t("queue.unassigned")}</span>?
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

type BoardCardProps = {
  ticket: Ticket
  onOpen: (ticket: Ticket) => void
  onMove: (ticket: Ticket, to: TicketStatusCode) => void
}

/**
 * Draggable card (mouse / touch anywhere on it). Keyboard users tab to the title button
 * (Enter opens the ticket) and the "Move to" menu (valid target statuses only).
 */
const BoardCard = ({ ticket, onOpen, onMove }: BoardCardProps) => {
  const { t } = useTranslation("tickets")
  const locked = FINAL_STATUSES.includes(ticket.status)
  // The card stays in place while dragging; the board renders a DragOverlay copy.
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
    disabled: locked,
  })
  const targets = STAFF_TRANSITIONS[ticket.status]

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      aria-roledescription={t("board.card_role")}
      onClick={() => onOpen(ticket)}
      className={cn(
        "group relative cursor-grab touch-manipulation rounded-xl border border-border bg-card p-3 transition-[border-color,box-shadow,opacity] duration-150 hover:border-border-strong hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <BoardCardBody ticket={ticket} />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(ticket)
        }}
        className="absolute inset-x-2 top-7 h-12 cursor-pointer rounded-md opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={t("board.open_ticket", { number: ticket.ticketNumber, subject: ticket.subject })}
      >
        <span className="sr-only">{ticket.subject}</span>
      </button>
      <div className="absolute top-2 right-2 flex items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
        {!locked ? (
          <GripVertical aria-hidden="true" className="size-4 text-muted-foreground/60 transition-opacity group-hover:text-muted-foreground" />
        ) : null}
        {targets.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 min-h-8"
                aria-label={t("board.move_menu", { number: ticket.ticketNumber })}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                <ArrowRightLeft aria-hidden="true" className="size-3.5" />
                {t("board.move_to")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {targets.map((status) => (
                <DropdownMenuItem key={status} className="cursor-pointer" onSelect={() => onMove(ticket, status)}>
                  {t(`status.${status}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </article>
  )
}

export { BoardCard, BoardCardBody }
