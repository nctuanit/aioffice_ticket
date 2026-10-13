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

const nullableDate = z.string().nullable().optional()

/** Staff view of a ticket (`GET /admin/tickets`, planned for backend P4). */
const ticketSchema = z.object({
  id: z.uuid(),
  ticketNumber: z.string(),
  requesterId: z.uuid(),
  requester: z
    .object({ id: z.uuid(), fullName: z.string(), email: z.email() })
    .optional(),
  source: ticketSourceSchema,
  workspaceId: z.uuid().nullable().optional(),
  assigneeId: z.uuid().nullable().optional(),
  assignee: z
    .object({ id: z.uuid(), fullName: z.string(), email: z.email() })
    .nullable()
    .optional(),
  category: ticketCategorySchema,
  productModule: ticketProductModuleSchema.nullable().optional(),
  subject: z.string(),
  description: z.string(),
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  /** ISO date; null once a staff member handled the ticket (no more 48h deadline) */
  expiresAt: nullableDate,
  firstHandledAt: nullableDate,
  lastMessageBy: z.enum(["REQUESTER", "STAFF", "SYSTEM"]).nullable().optional(),
  lastMessageAt: nullableDate,
  resolvedAt: nullableDate,
  closedAt: nullableDate,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ticketMessageSchema = z.object({
  id: z.uuid(),
  ticketId: z.uuid(),
  senderId: z.uuid().nullable().optional(),
  sender: z
    .object({ id: z.uuid(), fullName: z.string(), email: z.email() })
    .nullable()
    .optional(),
  body: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
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

type Ticket = z.infer<typeof ticketSchema>
type TicketMessage = z.infer<typeof ticketMessageSchema>
type TicketStatus = z.infer<typeof ticketStatusSchema>
type TicketCategory = z.infer<typeof ticketCategorySchema>
type TicketPriority = z.infer<typeof ticketPrioritySchema>
type TicketSource = z.infer<typeof ticketSourceSchema>
type PaginatedTickets = z.infer<typeof paginatedTicketsSchema>
type PaginatedTicketMessages = z.infer<typeof paginatedTicketMessagesSchema>

export {
  paginatedTicketMessagesSchema,
  paginatedTicketsSchema,
  ticketCategorySchema,
  ticketMessageSchema,
  ticketPrioritySchema,
  ticketProductModuleSchema,
  ticketSchema,
  ticketSourceSchema,
  ticketStatusSchema,
  type PaginatedTicketMessages,
  type PaginatedTickets,
  type Ticket,
  type TicketCategory,
  type TicketMessage,
  type TicketPriority,
  type TicketSource,
  type TicketStatus,
}
