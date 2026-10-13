import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import {
  addInternalNote,
  changeTicketAssignee,
  changeTicketPriority,
  changeTicketStatus,
  claimTicket,
  replyToCustomer,
  type SendMessageInput,
} from "@/features/tickets/api/tickets.api"
import type { TicketStatusCode } from "@/features/tickets/constants/ticket.constants"
import type { Ticket, TicketPriority } from "@/features/tickets/types/ticket.types"
import { apiErrorMessage } from "@/lib/api-error"

/**
 * After any staff action: put the fresh ticket into the detail cache and refetch
 * everything derived from it (queue pages, board columns, stats, history).
 */
const syncTicket = async (queryClient: QueryClient, ticket?: Ticket, ticketId?: string) => {
  const id = ticket?.id ?? ticketId
  if (ticket) queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ticketKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: ticketKeys.boards() }),
    queryClient.invalidateQueries({ queryKey: ticketKeys.stats() }),
    id ? queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) }) : Promise.resolve(),
  ])
}

const useOnError = () => {
  const { t } = useTranslation()
  return (error: unknown) => toast.error(apiErrorMessage(error, t))
}

const useClaimTicket = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const onError = useOnError()
  return useMutation({
    mutationFn: claimTicket,
    onSuccess: async (ticket) => {
      toast.success(t("toast.claimed", { number: ticket.ticketNumber }))
      await syncTicket(queryClient, ticket)
    },
    onError,
  })
}

const useChangeTicketStatus = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const onError = useOnError()
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: TicketStatusCode }) =>
      changeTicketStatus(ticketId, status),
    onSuccess: async (ticket) => {
      toast.success(t("toast.status_changed", { status: t(`status.${ticket.status}`) }))
      await syncTicket(queryClient, ticket)
    },
    onError,
  })
}

const useChangeTicketAssignee = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const onError = useOnError()
  return useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string | null }) =>
      changeTicketAssignee(ticketId, assigneeId),
    onSuccess: async (ticket) => {
      toast.success(t(ticket.assigneeId ? "toast.assigned" : "toast.unassigned"))
      await syncTicket(queryClient, ticket)
    },
    onError,
  })
}

const useChangeTicketPriority = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const onError = useOnError()
  return useMutation({
    mutationFn: ({ ticketId, priority }: { ticketId: string; priority: TicketPriority }) =>
      changeTicketPriority(ticketId, priority),
    onSuccess: async (ticket) => {
      toast.success(t("toast.priority_changed", { priority: t(`priority.${ticket.priority}`) }))
      await syncTicket(queryClient, ticket)
    },
    onError,
  })
}

type SendMode = "reply" | "note"

/**
 * Public reply or internal note. `clientRequestId` is created by the composer and kept
 * across retries, so a resend after a timeout never posts twice.
 */
const useSendTicketMessage = (ticketId: string) => {
  const queryClient = useQueryClient()
  const onError = useOnError()
  return useMutation({
    mutationFn: ({ mode, ...input }: Omit<SendMessageInput, "ticketId"> & { mode: SendMode }) =>
      mode === "note" ? addInternalNote({ ticketId, ...input }) : replyToCustomer({ ticketId, ...input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) }),
        syncTicket(queryClient, undefined, ticketId),
      ])
    },
    onError,
  })
}

export {
  syncTicket,
  useChangeTicketAssignee,
  useChangeTicketPriority,
  useChangeTicketStatus,
  useClaimTicket,
  useSendTicketMessage,
  type SendMode,
}
