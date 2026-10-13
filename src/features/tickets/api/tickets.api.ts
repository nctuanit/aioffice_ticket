import { z } from "zod"

import {
  QUEUE_PAGE_SIZE,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import type { TicketBoardFilters } from "@/features/tickets/types/ticket-search"
import {
  paginatedTicketEventsSchema,
  paginatedTicketMessagesSchema,
  paginatedTicketsSchema,
  supportCalendarSchema,
  supportHolidaySchema,
  ticketMessageSchema,
  ticketParticipantSchema,
  ticketSchema,
  ticketStatsSchema,
  userSummarySchema,
  type PaginatedTicketEvents,
  type PaginatedTicketMessages,
  type PaginatedTickets,
  type SupportCalendar,
  type SupportHoliday,
  type Ticket,
  type TicketMessage,
  type TicketParticipant,
  type TicketParticipantRole,
  type TicketPriority,
  type TicketStats,
  type UserSummary,
} from "@/features/tickets/types/ticket.types"
import { api } from "@/lib/axios"

/**
 * Staff endpoints of open-office (`feat/support-tickets`, phase P4):
 * `/admin/tickets*` (roles admin + support) and `/admin/support/*` (admin only).
 */
const id = (ticketId: string) => encodeURIComponent(ticketId)

const TICKET_ENDPOINTS = {
  list: "/admin/tickets",
  stats: "/admin/tickets/stats",
  assignees: "/admin/tickets/assignees",
  detail: (ticketId: string) => `/admin/tickets/${id(ticketId)}`,
  messages: (ticketId: string) => `/admin/tickets/${id(ticketId)}/messages`,
  internalNotes: (ticketId: string) => `/admin/tickets/${id(ticketId)}/internal-notes`,
  events: (ticketId: string) => `/admin/tickets/${id(ticketId)}/events`,
  claim: (ticketId: string) => `/admin/tickets/${id(ticketId)}/claim`,
  status: (ticketId: string) => `/admin/tickets/${id(ticketId)}/status`,
  assignee: (ticketId: string) => `/admin/tickets/${id(ticketId)}/assignee`,
  priority: (ticketId: string) => `/admin/tickets/${id(ticketId)}/priority`,
  participants: (ticketId: string) => `/admin/tickets/${id(ticketId)}/participants`,
  participant: (ticketId: string, userId: string) =>
    `/admin/tickets/${id(ticketId)}/participants/${encodeURIComponent(userId)}`,
  calendar: "/admin/support/calendar",
  holidays: "/admin/support/holidays",
  holiday: (date: string) => `/admin/support/holidays/${encodeURIComponent(date)}`,
} as const

type ListTicketsParams = TicketBoardFilters & {
  status?: TicketStatusCode
  page?: number
  limit?: number
  /** Applied to `updatedAt` after the deadline sort. */
  sortOrder?: "ASC" | "DESC"
}

const listTickets = async (params: ListTicketsParams): Promise<PaginatedTickets> => {
  const { data } = await api.get(TICKET_ENDPOINTS.list, {
    params: {
      status: params.status,
      assignee: params.assignee,
      participant: params.participant,
      category: params.category,
      productModule: params.productModule,
      priority: params.priority,
      source: params.source,
      search: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? QUEUE_PAGE_SIZE,
      sortOrder: params.sortOrder,
    },
  })
  return paginatedTicketsSchema.parse(data)
}

const getTicket = async (ticketId: string): Promise<Ticket> => {
  const { data } = await api.get(TICKET_ENDPOINTS.detail(ticketId))
  return ticketSchema.parse(data)
}

const getTicketStats = async (): Promise<TicketStats> => {
  const { data } = await api.get(TICKET_ENDPOINTS.stats)
  return ticketStatsSchema.parse(data)
}

const listAssignees = async (): Promise<UserSummary[]> => {
  const { data } = await api.get(TICKET_ENDPOINTS.assignees)
  return z.array(userSummarySchema).parse(data)
}

const listTicketMessages = async (ticketId: string): Promise<PaginatedTicketMessages> => {
  const { data } = await api.get(TICKET_ENDPOINTS.messages(ticketId), { params: { limit: 100 } })
  return paginatedTicketMessagesSchema.parse(data)
}

const listTicketEvents = async (ticketId: string): Promise<PaginatedTicketEvents> => {
  const { data } = await api.get(TICKET_ENDPOINTS.events(ticketId), { params: { limit: 100 } })
  return paginatedTicketEventsSchema.parse(data)
}

type SendMessageInput = { ticketId: string; body: string; clientRequestId: string }

const replyToCustomer = async ({ ticketId, ...body }: SendMessageInput): Promise<TicketMessage> => {
  const { data } = await api.post(TICKET_ENDPOINTS.messages(ticketId), body)
  return ticketMessageSchema.parse(data)
}

const addInternalNote = async ({ ticketId, ...body }: SendMessageInput): Promise<TicketMessage> => {
  const { data } = await api.post(TICKET_ENDPOINTS.internalNotes(ticketId), body)
  return ticketMessageSchema.parse(data)
}

const claimTicket = async (ticketId: string): Promise<Ticket> => {
  const { data } = await api.post(TICKET_ENDPOINTS.claim(ticketId))
  return ticketSchema.parse(data)
}

const changeTicketStatus = async (ticketId: string, status: TicketStatusCode): Promise<Ticket> => {
  const { data } = await api.patch(TICKET_ENDPOINTS.status(ticketId), { status })
  return ticketSchema.parse(data)
}

const changeTicketAssignee = async (ticketId: string, assigneeId: string | null): Promise<Ticket> => {
  const { data } = await api.patch(TICKET_ENDPOINTS.assignee(ticketId), { assigneeId })
  return ticketSchema.parse(data)
}

const changeTicketPriority = async (ticketId: string, priority: TicketPriority): Promise<Ticket> => {
  const { data } = await api.patch(TICKET_ENDPOINTS.priority(ticketId), { priority })
  return ticketSchema.parse(data)
}

type AddParticipantInput = { ticketId: string; userId: string; role?: TicketParticipantRole }

const addParticipant = async ({ ticketId, ...body }: AddParticipantInput): Promise<TicketParticipant> => {
  const { data } = await api.post(TICKET_ENDPOINTS.participants(ticketId), body)
  return ticketParticipantSchema.parse(data)
}

const removeParticipant = async ({ ticketId, userId }: { ticketId: string; userId: string }): Promise<void> => {
  await api.delete(TICKET_ENDPOINTS.participant(ticketId, userId))
}

const getSupportCalendar = async (): Promise<SupportCalendar> => {
  const { data } = await api.get(TICKET_ENDPOINTS.calendar)
  return supportCalendarSchema.parse(data)
}

const updateSupportCalendar = async (workingWeekdays: number[]): Promise<SupportCalendar> => {
  const { data } = await api.put(TICKET_ENDPOINTS.calendar, { workingWeekdays })
  return supportCalendarSchema.parse(data)
}

const listHolidays = async (): Promise<SupportHoliday[]> => {
  const { data } = await api.get(TICKET_ENDPOINTS.holidays)
  return z.array(supportHolidaySchema).parse(data)
}

const addHoliday = async (holiday: { date: string; name: string }): Promise<SupportHoliday> => {
  const { data } = await api.post(TICKET_ENDPOINTS.holidays, holiday)
  return supportHolidaySchema.parse(data)
}

const removeHoliday = async (date: string): Promise<void> => {
  await api.delete(TICKET_ENDPOINTS.holiday(date))
}

export {
  addHoliday,
  addInternalNote,
  addParticipant,
  changeTicketAssignee,
  changeTicketPriority,
  changeTicketStatus,
  claimTicket,
  getSupportCalendar,
  getTicket,
  getTicketStats,
  listAssignees,
  listHolidays,
  listTicketEvents,
  listTicketMessages,
  listTickets,
  removeHoliday,
  removeParticipant,
  replyToCustomer,
  TICKET_ENDPOINTS,
  updateSupportCalendar,
  type AddParticipantInput,
  type ListTicketsParams,
  type SendMessageInput,
}
