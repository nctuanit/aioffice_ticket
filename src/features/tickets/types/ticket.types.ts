import { z } from "zod"

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
} from "@/features/tickets/constants/ticket.constants"

const ticketStatusSchema = z.enum(TICKET_STATUSES)
const ticketCategorySchema = z.enum(TICKET_CATEGORIES)
const ticketProductModuleSchema = z.enum(TICKET_PRODUCT_MODULES)
const ticketPrioritySchema = z.enum(TICKET_PRIORITIES)
const ticketSourceSchema = z.enum(TICKET_SOURCES)
const ticketActorSchema = z.enum(["REQUESTER", "STAFF", "SYSTEM"])

const nullableDate = z.string().nullable().optional()

/** `UserSummaryResDto` — attached to tickets, messages and events. */
const userSummarySchema = z.object({
  id: z.uuid(),
  email: z.string(),
  fullName: z.string(),
  role: z.string().optional(),
})

const ticketParticipantRoleSchema = z.enum(["WATCHER", "COLLABORATOR", "REVIEWER"])

/** `TicketParticipantResDto` — people tagged on a ticket (staff only; customers never see them). */
const ticketParticipantSchema = z.object({
  id: z.uuid(),
  kind: z.string().optional(),
  role: ticketParticipantRoleSchema,
  userId: z.uuid().nullable().optional(),
  user: userSummarySchema.nullable().optional(),
  addedBy: z.uuid().nullable().optional(),
  createdAt: z.string(),
})

/** Staff view of a ticket (`StaffTicketResDto`, `GET /admin/tickets*`). */
const ticketSchema = z.object({
  id: z.uuid(),
  ticketNumber: z.string(),
  requesterId: z.uuid(),
  requester: userSummarySchema.nullable().optional(),
  source: ticketSourceSchema,
  workspaceId: z.uuid().nullable().optional(),
  workspace: z.object({ id: z.uuid(), name: z.string() }).nullable().optional(),
  assigneeId: z.uuid().nullable().optional(),
  assignee: userSummarySchema.nullable().optional(),
  participants: z.array(ticketParticipantSchema).default([]),
  category: ticketCategorySchema,
  productModule: ticketProductModuleSchema.nullable().optional(),
  subject: z.string(),
  description: z.string(),
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  /** ISO date; null once a staff member handled the ticket (no more 48h deadline). */
  expiresAt: nullableDate,
  /** Working ms left before the deadline (unhandled OPEN only); 0 = overdue, waiting for the job. */
  remainingWorkingMs: z.number().nullable().optional(),
  expiryWarnedAt: nullableDate,
  firstHandledAt: nullableDate,
  firstHandledBy: z.uuid().nullable().optional(),
  lastMessageBy: ticketActorSchema.nullable().optional(),
  lastMessageAt: nullableDate,
  resolvedAt: nullableDate,
  closedAt: nullableDate,
  expiredAt: nullableDate,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ticketMessageSchema = z.object({
  id: z.uuid(),
  ticketId: z.uuid(),
  senderId: z.uuid().nullable().optional(),
  sender: userSummarySchema.nullable().optional(),
  body: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
})

const ticketEventSchema = z.object({
  id: z.uuid(),
  ticketId: z.uuid(),
  actorType: ticketActorSchema,
  actorId: z.uuid().nullable().optional(),
  actor: userSummarySchema.nullable().optional(),
  eventType: z.string(),
  oldValue: z.record(z.string(), z.unknown()).nullable().optional(),
  newValue: z.record(z.string(), z.unknown()).nullable().optional(),
  isPublic: z.boolean(),
  createdAt: z.string(),
})

const countMapSchema = z.record(z.string(), z.number())

const ticketStatsSchema = z.object({
  byStatus: countMapSchema,
  byProductModule: countMapSchema,
  byCategory: countMapSchema,
  unassigned: z.number(),
  expiringSoon: z.number(),
  expiredLast7Days: z.number(),
})

const supportCalendarSchema = z.object({
  utcOffsetMinutes: z.number(),
  workingWeekdays: z.array(z.number().int().min(0).max(6)),
  holidays: z.array(z.string()),
})

const supportHolidaySchema = z.object({
  date: z.string(),
  name: z.string(),
  createdAt: z.string().optional(),
})

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number().optional(),
})

const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), meta: paginationMetaSchema })

const paginatedTicketsSchema = paginated(ticketSchema)
const paginatedTicketMessagesSchema = paginated(ticketMessageSchema)
const paginatedTicketEventsSchema = paginated(ticketEventSchema)

type Ticket = z.infer<typeof ticketSchema>
type TicketParticipant = z.infer<typeof ticketParticipantSchema>
type TicketParticipantRole = z.infer<typeof ticketParticipantRoleSchema>
type TicketMessage = z.infer<typeof ticketMessageSchema>
type TicketEvent = z.infer<typeof ticketEventSchema>
type TicketStats = z.infer<typeof ticketStatsSchema>
type UserSummary = z.infer<typeof userSummarySchema>
type SupportCalendar = z.infer<typeof supportCalendarSchema>
type SupportHoliday = z.infer<typeof supportHolidaySchema>
type TicketStatus = z.infer<typeof ticketStatusSchema>
type TicketCategory = z.infer<typeof ticketCategorySchema>
type TicketProductModule = z.infer<typeof ticketProductModuleSchema>
type TicketPriority = z.infer<typeof ticketPrioritySchema>
type TicketSource = z.infer<typeof ticketSourceSchema>
type PaginatedTickets = z.infer<typeof paginatedTicketsSchema>
type PaginatedTicketMessages = z.infer<typeof paginatedTicketMessagesSchema>
type PaginatedTicketEvents = z.infer<typeof paginatedTicketEventsSchema>

export {
  paginatedTicketEventsSchema,
  paginatedTicketMessagesSchema,
  paginatedTicketsSchema,
  supportCalendarSchema,
  supportHolidaySchema,
  ticketCategorySchema,
  ticketEventSchema,
  ticketMessageSchema,
  ticketParticipantRoleSchema,
  ticketParticipantSchema,
  ticketPrioritySchema,
  ticketProductModuleSchema,
  ticketSchema,
  ticketSourceSchema,
  ticketStatsSchema,
  ticketStatusSchema,
  userSummarySchema,
  type PaginatedTicketEvents,
  type PaginatedTicketMessages,
  type PaginatedTickets,
  type SupportCalendar,
  type SupportHoliday,
  type Ticket,
  type TicketCategory,
  type TicketEvent,
  type TicketMessage,
  type TicketParticipant,
  type TicketParticipantRole,
  type TicketPriority,
  type TicketProductModule,
  type TicketSource,
  type TicketStats,
  type TicketStatus,
  type UserSummary,
}
