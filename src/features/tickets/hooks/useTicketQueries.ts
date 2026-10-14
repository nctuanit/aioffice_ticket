import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import {
  getAttachmentDownloadUrl,
  getTicket,
  getTicketStats,
  listAssignees,
  listTicketEvents,
  listTicketMessages,
  listTickets,
  type ListTicketsParams,
} from "@/features/tickets/api/tickets.api"
import { ATTACHMENT_URL_REFRESH_MARGIN_MS } from "@/features/tickets/constants/attachment.constants"
import {
  DETAIL_REFETCH_INTERVAL_MS,
  QUEUE_REFETCH_INTERVAL_MS,
} from "@/features/tickets/constants/ticket.constants"
import { useLiveRefetchInterval } from "@/features/tickets/realtime/useLiveRefetchInterval"

/**
 * Queue page; the realtime stream invalidates it on every ticket change. Polling stays
 * as a fallback (30s, 60s while the stream is live) so countdowns keep moving.
 */
const useTicketList = (params: ListTicketsParams) => {
  const refetchInterval = useLiveRefetchInterval(QUEUE_REFETCH_INTERVAL_MS)
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => listTickets(params),
    placeholderData: keepPreviousData,
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

const useTicketDetail = (ticketId: string) => {
  const refetchInterval = useLiveRefetchInterval(DETAIL_REFETCH_INTERVAL_MS)
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => getTicket(ticketId),
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

const useTicketMessages = (ticketId: string) => {
  const refetchInterval = useLiveRefetchInterval(DETAIL_REFETCH_INTERVAL_MS)
  return useQuery({
    queryKey: ticketKeys.messages(ticketId),
    queryFn: () => listTicketMessages(ticketId),
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

const useTicketEvents = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.events(ticketId),
    queryFn: () => listTicketEvents(ticketId),
  })

const useTicketStats = () => {
  const refetchInterval = useLiveRefetchInterval(QUEUE_REFETCH_INTERVAL_MS)
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: getTicketStats,
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

/**
 * Presigned URL (5 min; inline video 30 min), cached until a minute before it expires;
 * callers refetch when `isStale` before following it.
 */
const useAttachmentDownloadUrl = (ticketId: string, attachmentId: string, inline = false) =>
  useQuery({
    queryKey: ticketKeys.attachmentUrl(ticketId, attachmentId, inline),
    queryFn: () => getAttachmentDownloadUrl(ticketId, attachmentId, inline),
    staleTime: (query) =>
      Math.max(0, (query.state.data?.expiresIn ?? 300) * 1000 - ATTACHMENT_URL_REFRESH_MARGIN_MS),
  })

/** Active admin / support users; changes rarely. */
const useAssignees = () =>
  useQuery({
    queryKey: ticketKeys.assignees(),
    queryFn: listAssignees,
    staleTime: 5 * 60_000,
  })

export {
  useAssignees,
  useAttachmentDownloadUrl,
  useTicketDetail,
  useTicketEvents,
  useTicketList,
  useTicketMessages,
  useTicketStats,
}
