import type { TicketStreamEvent } from "@/features/tickets/realtime/ticket-stream.client"
import {
  ticketProductModuleSchema,
  ticketSourceSchema,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketProductModule,
  type TicketSource,
} from "@/features/tickets/types/ticket.types"

/** What a new-ticket toast shows: the staff detail when it arrived in time, else the stream payload only. */
type NewTicketToastItem = {
  ticketId: string
  ticketNumber: string
  subject: string
  productModule: TicketProductModule | null
  source: TicketSource | null
  category: TicketCategory | null
  priority: TicketPriority | null
  requesterName: string | null
  /** Arrival order of the stream event; the grouped toast lists the newest first. */
  seq: number
}

/** HIGH / URGENT toasts stay until closed. */
const isPressingPriority = (priority: TicketPriority) => priority === "HIGH" || priority === "URGENT"

const toNewTicketToastItem = (event: TicketStreamEvent, ticket: Ticket | null, seq: number): NewTicketToastItem => ({
  ticketId: event.ticketId,
  ticketNumber: ticket?.ticketNumber ?? event.ticketNumber,
  subject: ticket?.subject ?? event.subject,
  productModule: ticket
    ? (ticket.productModule ?? null)
    : (ticketProductModuleSchema.safeParse(event.productModule).data ?? null),
  source: ticket?.source ?? ticketSourceSchema.safeParse(event.source).data ?? null,
  category: ticket?.category ?? null,
  priority: ticket?.priority ?? null,
  requesterName: ticket?.requester?.fullName.trim() || ticket?.requester?.email || null,
  seq,
})

export { isPressingPriority, toNewTicketToastItem, type NewTicketToastItem }
