import type { TicketListSearch } from "@/routes/router"

const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketListSearch) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (ticketId: string) => [...ticketKeys.details(), ticketId] as const,
  messages: (ticketId: string) => [...ticketKeys.detail(ticketId), "messages"] as const,
  stats: () => [...ticketKeys.all, "stats"] as const,
}

export { ticketKeys }
