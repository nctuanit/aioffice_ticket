import { api } from "@/lib/axios"
import type { TicketListSearch } from "@/routes/router"
import {
  paginatedTicketMessagesSchema,
  paginatedTicketsSchema,
  ticketSchema,
  type PaginatedTicketMessages,
  type PaginatedTickets,
  type Ticket,
} from "@/features/tickets/types/ticket.types"

/**
 * Staff endpoints (`/api/admin/tickets`, roles admin + support). The backend side ships in
 * open-office phase P4; the client is written against the agreed contract so P6 can wire the
 * pages without touching the transport layer.
 */
const TICKET_ENDPOINTS = {
  list: "/admin/tickets",
  detail: (ticketId: string) => `/admin/tickets/${encodeURIComponent(ticketId)}`,
  messages: (ticketId: string) => `/admin/tickets/${encodeURIComponent(ticketId)}/messages`,
} as const

const listTickets = async (filters: TicketListSearch): Promise<PaginatedTickets> => {
  const { data } = await api.get(TICKET_ENDPOINTS.list, {
    params: {
      status: filters.status,
      assignee: filters.assignee,
      search: filters.q,
      page: filters.page,
    },
  })
  return paginatedTicketsSchema.parse(data)
}

const getTicket = async (ticketId: string): Promise<Ticket> => {
  const { data } = await api.get(TICKET_ENDPOINTS.detail(ticketId))
  return ticketSchema.parse(data)
}

const listTicketMessages = async (ticketId: string): Promise<PaginatedTicketMessages> => {
  const { data } = await api.get(TICKET_ENDPOINTS.messages(ticketId), { params: { limit: 100 } })
  return paginatedTicketMessagesSchema.parse(data)
}

export { getTicket, listTicketMessages, listTickets, TICKET_ENDPOINTS }
