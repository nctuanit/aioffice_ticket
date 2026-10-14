import { useEffect, useRef } from "react"

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import {
  changeTicketStatus,
  claimTicket,
  listTickets,
  replyToCustomer,
} from "@/features/tickets/api/tickets.api"
import {
  BOARD_CLOSED_WINDOW_DAYS,
  BOARD_COLUMN_LIMIT,
  BOARD_COLUMNS,
  QUEUE_REFETCH_INTERVAL_MS,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import { syncTicket } from "@/features/tickets/hooks/useTicketMutations"
import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"
import { useLiveRefetchInterval } from "@/features/tickets/realtime/useLiveRefetchInterval"
import type { TicketBoardFilters } from "@/features/tickets/types/ticket-search"
import type { PaginatedTickets, Ticket } from "@/features/tickets/types/ticket.types"
import { apiErrorCode, apiErrorMessage } from "@/lib/api-error"

type BoardStatus = (typeof BOARD_COLUMNS)[number]

type BoardColumnData = {
  status: BoardStatus
  tickets: Ticket[]
  total: number
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

const DAY_MS = 24 * 60 * 60 * 1000

/** The CLOSED column only keeps tickets closed within the window (filtered client-side). */
const visibleTickets = (status: BoardStatus, tickets: Ticket[], now: number) =>
  status === "CLOSED"
    ? tickets.filter((ticket) => {
        const closedAt = ticket.closedAt ?? ticket.updatedAt
        return now - new Date(closedAt).getTime() <= BOARD_CLOSED_WINDOW_DAYS * DAY_MS
      })
    : tickets

/**
 * One query per column (`GET /admin/tickets?status=…`), refreshed by the realtime stream and
 * polled (30s, 60s while live) except while a card is being dragged, so a refetch never yanks
 * the card out from under the pointer. Stream events during a drag only mark the columns
 * stale; they refetch when the drag ends.
 */
const useBoardColumns = (filters: TicketBoardFilters, paused: boolean): BoardColumnData[] => {
  const queryClient = useQueryClient()
  const setBoardPaused = useTicketStreamStore((state) => state.setBoardPaused)
  const refetchInterval = useLiveRefetchInterval(QUEUE_REFETCH_INTERVAL_MS)

  const wasPaused = useRef(false)
  useEffect(() => {
    setBoardPaused(paused)
    // drag just ended: pick up stream events that arrived meanwhile (only invalidated columns)
    if (wasPaused.current && !paused) {
      void queryClient.refetchQueries(
        { queryKey: ticketKeys.boards(), type: "active", predicate: (query) => query.state.isInvalidated },
        { cancelRefetch: false },
      )
    }
    wasPaused.current = paused
    return () => setBoardPaused(false)
  }, [paused, queryClient, setBoardPaused])

  const results = useQueries({
    queries: BOARD_COLUMNS.map((status) => ({
      queryKey: ticketKeys.boardColumn(status, filters),
      queryFn: () =>
        listTickets({
          ...filters,
          status,
          limit: BOARD_COLUMN_LIMIT,
          sortOrder: status === "CLOSED" ? ("DESC" as const) : undefined,
        }),
      refetchInterval: paused ? (false as const) : refetchInterval,
      refetchOnWindowFocus: !paused,
    })),
  })
  return BOARD_COLUMNS.map((status, index) => {
    const result = results[index]
    // Window measured from when the column was fetched (pure during render).
    const tickets = visibleTickets(status, result.data?.data ?? [], result.dataUpdatedAt)
    return {
      status,
      tickets,
      total: status === "CLOSED" ? tickets.length : (result.data?.meta.total ?? 0),
      isLoading: result.isPending,
      isError: result.isError,
      error: result.error,
      refetch: () => void result.refetch(),
    }
  })
}

type MoveInput = {
  ticket: Ticket
  to: TicketStatusCode
  /** Optional public message sent before the status change (resolve / close dialogs). */
  message?: string
  clientRequestId?: string
  currentUserId?: string
}

type MoveContext = { snapshots: Array<[readonly unknown[], PaginatedTickets | undefined]> }

const moveInPage = (page: PaginatedTickets | undefined, ticket: Ticket, from: string, to: string, columnStatus: string) => {
  if (!page) return page
  if (columnStatus === from) {
    return {
      ...page,
      data: page.data.filter((item) => item.id !== ticket.id),
      meta: { ...page.meta, total: Math.max(0, page.meta.total - 1) },
    }
  }
  if (columnStatus === to) {
    return {
      ...page,
      data: [{ ...ticket, status: to as Ticket["status"] }, ...page.data],
      meta: { ...page.meta, total: page.meta.total + 1 },
    }
  }
  return page
}

/**
 * Drag-and-drop status change. Optimistic: the card jumps to the target column at once;
 * a 409 (someone else changed it first) or 403 puts it back and explains why.
 * OPEN → IN_PROGRESS on an unassigned ticket claims it for the current user first.
 */
const useMoveTicket = (filters: TicketBoardFilters) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()

  return useMutation<Ticket, unknown, MoveInput, MoveContext>({
    mutationFn: async ({ ticket, to, message, clientRequestId, currentUserId }) => {
      if (message?.trim() && clientRequestId) {
        await replyToCustomer({ ticketId: ticket.id, body: message.trim(), clientRequestId })
      }
      if (ticket.status === "OPEN" && to === "IN_PROGRESS" && !ticket.assigneeId && currentUserId) {
        await claimTicket(ticket.id)
      }
      return changeTicketStatus(ticket.id, to)
    },
    onMutate: async ({ ticket, to }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.boards() })
      const snapshots: MoveContext["snapshots"] = []
      for (const status of [ticket.status, to]) {
        const key = ticketKeys.boardColumn(status, filters)
        const previous = queryClient.getQueryData<PaginatedTickets>(key)
        snapshots.push([key, previous])
        queryClient.setQueryData<PaginatedTickets | undefined>(key, (page) =>
          moveInPage(page, ticket, ticket.status, to, status),
        )
      }
      return { snapshots }
    },
    onError: (error, { ticket }, context) => {
      for (const [key, previous] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, previous)
      }
      const code = apiErrorCode(error)
      if (code === "TICKET_INVALID_TRANSITION" || code === "TICKET_ALREADY_ASSIGNED") {
        toast.error(t("board.move_conflict", { number: ticket.ticketNumber }))
      } else {
        toast.error(apiErrorMessage(error, tAll))
      }
    },
    onSuccess: (ticket) => {
      toast.success(
        t("board.moved", { number: ticket.ticketNumber, status: t(`status.${ticket.status}`) }),
      )
    },
    onSettled: async (ticket, _error, { ticket: original }) => {
      await syncTicket(queryClient, ticket, original.id)
    },
  })
}

export { useBoardColumns, useMoveTicket, type BoardColumnData, type BoardStatus, type MoveInput }
