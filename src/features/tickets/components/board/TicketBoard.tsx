import { useRef, useState } from "react"

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
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import type { TicketBoardFilters } from "@/features/tickets/types/ticket-search"
import type { Ticket } from "@/features/tickets/types/ticket.types"

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
const TicketBoard = ({ filters }: { filters: TicketBoardFilters }) => {
  const { t } = useTranslation("tickets")
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [dragging, setDragging] = useState<Ticket | null>(null)
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const lastDropAt = useRef(0)

  const columns = useBoardColumns(filters, dragging !== null)
  const move = useMoveTicket(filters)

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

      <TicketDetailSheet ticketId={openTicketId} onClose={() => setOpenTicketId(null)} />
    </>
  )
}

export { TicketBoard }
