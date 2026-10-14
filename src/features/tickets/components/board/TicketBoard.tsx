import { useEffect, useMemo, useRef, useState } from "react"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SearchX, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { BoardCard, BoardCardBody } from "@/features/tickets/components/board/BoardCard"
import { BoardColumn } from "@/features/tickets/components/board/BoardColumn"
import { MoveTicketDialog, type PendingMove } from "@/features/tickets/components/board/MoveTicketDialog"
import { TicketDetailSheet } from "@/features/tickets/components/detail/TicketDetailSheet"
import {
  canStaffTransition,
  CONFIRM_STATUSES,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import { useBoardColumns, useMoveTicket } from "@/features/tickets/hooks/useBoard"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { useQueueNavStore } from "@/features/tickets/stores/queue-nav.store"
import type { TicketBoardFilters } from "@/features/tickets/types/ticket-search"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { customerReplied } from "@/features/tickets/utils/ticket-signals"
import { EmptyState } from "@/shared/components/EmptyState"

/** Clicks right after a drop are the tail of the drag, not an "open" intent. */
const CLICK_AFTER_DRAG_MS = 250

const ticketFrom = (data: unknown): Ticket | undefined =>
  (data as { ticket?: Ticket } | undefined)?.ticket

/**
 * Kanban view: one column per active status. Pointer / touch users drag cards; keyboard
 * and screen-reader users move a card with its "Move to" menu, which lists only valid
 * targets (dnd-kit's keyboard drag scrolls the board instead of changing column here). Dropping a card on a column changes the
 * ticket status (validated against the staff transition table, confirmed for
 * resolve / close / cancel). Clicking a card opens the detail in a side sheet.
 */
type TicketBoardProps = {
  filters: TicketBoardFilters
  /** "Customer replied" quick filter: narrows the loaded cards client-side. */
  repliedOnly?: boolean
  /** Any filter is active (offers "clear filters" when every column comes back empty). */
  filtered?: boolean
  onClearFilters?: () => void
}

const TicketBoard = ({ filters, repliedOnly = false, filtered = false, onClearFilters }: TicketBoardProps) => {
  const { t } = useTranslation("tickets")
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [dragging, setDragging] = useState<Ticket | null>(null)
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const lastDropAt = useRef(0)

  const loadedColumns = useBoardColumns(filters, dragging !== null)
  const move = useMoveTicket(filters)
  const setQueueIds = useQueueNavStore((state) => state.setIds)

  const columns = repliedOnly
    ? loadedColumns.map((column) => {
        const tickets = column.tickets.filter(customerReplied)
        return { ...column, tickets, total: tickets.length }
      })
    : loadedColumns

  // Next / previous in the detail sheet walk the board column by column, top to bottom.
  const orderKey = columns.flatMap((column) => column.tickets.map((ticket) => ticket.id)).join(",")
  const orderedIds = useMemo(() => (orderKey ? orderKey.split(",") : []), [orderKey])
  const allLoaded = columns.every((column) => !column.isLoading)
  useEffect(() => {
    if (allLoaded) setQueueIds(orderedIds)
  }, [allLoaded, orderedIds, setQueueIds])
  const boardEmpty = allLoaded && columns.every((column) => !column.isError && column.tickets.length === 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const requestMove = (ticket: Ticket, to: TicketStatusCode) => {
    if (ticket.status === to) return
    if (!canStaffTransition(ticket.status, to)) {
      toast.info(
        t("board.move_not_allowed", { from: t(`status.${ticket.status}`), to: t(`status.${to}`) }),
      )
      return
    }
    if (CONFIRM_STATUSES.includes(to)) {
      setPending({ ticket, to })
      return
    }
    move.mutate({ ticket, to, currentUserId })
  }

  const onDragStart = (event: DragStartEvent) => setDragging(ticketFrom(event.active.data.current) ?? null)

  const onDragEnd = (event: DragEndEvent) => {
    const ticket = ticketFrom(event.active.data.current)
    setDragging(null)
    lastDropAt.current = Date.now()
    if (!ticket || !event.over) return
    requestMove(ticket, event.over.id as TicketStatusCode)
  }

  const openTicket = (ticket: Ticket) => {
    if (Date.now() - lastDropAt.current < CLICK_AFTER_DRAG_MS) return
    setOpenTicketId(ticket.id)
  }

  const statusName = (id: unknown) => t(`status.${String(id)}`)
  const ticketName = (data: unknown) => ticketFrom(data)?.ticketNumber ?? ""
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("board.a11y.picked", { number: ticketName(active.data.current) }),
    onDragOver: ({ active, over }) =>
      over
        ? t("board.a11y.over", { number: ticketName(active.data.current), status: statusName(over.id) })
        : t("board.a11y.outside", { number: ticketName(active.data.current) }),
    onDragEnd: ({ active, over }) =>
      over
        ? t("board.a11y.dropped", { number: ticketName(active.data.current), status: statusName(over.id) })
        : t("board.a11y.cancelled", { number: ticketName(active.data.current) }),
    onDragCancel: ({ active }) => t("board.a11y.cancelled", { number: ticketName(active.data.current) }),
  }

  if (boardEmpty && (filtered || repliedOnly)) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("queue.no_match_title")}
        description={repliedOnly ? t("board.replied_empty_body") : t("queue.no_match_body")}
        action={
          onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              <X aria-hidden="true" />
              {t("filters.clear")}
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: t("board.a11y.instructions") },
        }}
      >
        <div
          className="-mx-4 flex min-h-[24rem] flex-[1_1_0px] snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:snap-none lg:px-8"
          aria-label={t("board.label")}
          role="region"
        >
          {columns.map((column) => {
            const valid = dragging ? canStaffTransition(dragging.status, column.status) : false
            const isSource = dragging?.status === column.status
            return (
              <BoardColumn
                key={column.status}
                column={column}
                disabled={Boolean(dragging) && !valid && !isSource}
                accepting={valid}
              >
                {column.tickets.map((ticket) => (
                  <BoardCard key={ticket.id} ticket={ticket} onOpen={openTicket} onMove={requestMove} />
                ))}
              </BoardColumn>
            )
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <div className="w-[17.5rem] rotate-1 cursor-grabbing rounded-xl border border-primary/40 bg-card p-3 shadow-lg">
              <BoardCardBody ticket={dragging} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MoveTicketDialog
        key={pending ? `${pending.ticket.id}-${pending.to}` : "none"}
        pending={pending}
        submitting={move.isPending}
        onCancel={() => setPending(null)}
        onConfirm={(confirmed, message) => {
          move.mutate(
            {
              ticket: confirmed.ticket,
              to: confirmed.to,
              message,
              clientRequestId: crypto.randomUUID(),
              currentUserId,
            },
            { onSettled: () => setPending(null) },
          )
        }}
      />

      <TicketDetailSheet
        ticketId={openTicketId}
        onClose={() => setOpenTicketId(null)}
        onOpenTicket={setOpenTicketId}
      />
    </>
  )
}

export { TicketBoard }
