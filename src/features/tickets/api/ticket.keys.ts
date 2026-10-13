import type { ListTicketsParams } from "@/features/tickets/api/tickets.api"
import type { TicketBoardFilters } from "@/features/tickets/types/ticket-search"

const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (params: ListTicketsParams) => [...ticketKeys.lists(), params] as const,
  boards: () => [...ticketKeys.all, "board"] as const,
  boardColumn: (status: string, filters: TicketBoardFilters) =>
    [...ticketKeys.boards(), status, filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (ticketId: string) => [...ticketKeys.details(), ticketId] as const,
  messages: (ticketId: string) => [...ticketKeys.detail(ticketId), "messages"] as const,
  events: (ticketId: string) => [...ticketKeys.detail(ticketId), "events"] as const,
  /** Outside `detail(ticketId)`: a message/detail invalidation must not refetch every presigned URL. */
  attachmentUrl: (ticketId: string, attachmentId: string, inline: boolean) =>
    [...ticketKeys.all, "attachment-url", ticketId, attachmentId, inline] as const,
  stats: () => [...ticketKeys.all, "stats"] as const,
  assignees: () => [...ticketKeys.all, "assignees"] as const,
  calendar: () => ["support", "calendar"] as const,
  holidays: () => ["support", "holidays"] as const,
}

export { ticketKeys }
