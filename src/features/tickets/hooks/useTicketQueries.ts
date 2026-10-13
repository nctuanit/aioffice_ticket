import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import {
  getTicket,
  getTicketStats,
  listAssignees,
  listTicketEvents,
  listTicketMessages,
  listTickets,
  type ListTicketsParams,
} from "@/features/tickets/api/tickets.api"
import {
  DETAIL_REFETCH_INTERVAL_MS,
  QUEUE_REFETCH_INTERVAL_MS,
} from "@/features/tickets/constants/ticket.constants"

/** Queue page; polls while the tab is visible so countdowns and new tickets stay fresh. */
const useTicketList = (params: ListTicketsParams) =>
  useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => listTickets(params),
    placeholderData: keepPreviousData,
    refetchInterval: QUEUE_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })

const useTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => getTicket(ticketId),
    refetchInterval: DETAIL_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })

const useTicketMessages = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.messages(ticketId),
    queryFn: () => listTicketMessages(ticketId),
    refetchInterval: DETAIL_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })

const useTicketEvents = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.events(ticketId),
    queryFn: () => listTicketEvents(ticketId),
  })

const useTicketStats = () =>
  useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: getTicketStats,
    refetchInterval: QUEUE_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
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
  useTicketDetail,
  useTicketEvents,
  useTicketList,
  useTicketMessages,
  useTicketStats,
}
