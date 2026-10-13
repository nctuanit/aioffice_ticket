import type { TicketStatus } from "@/features/tickets/types/ticket.types"

/** Dot color per status (board column headers, compact rows). */
const STATUS_DOT: Record<TicketStatus, string> = {
  OPEN: "bg-primary",
  IN_PROGRESS: "bg-progress",
  WAITING_FOR_USER: "bg-warning",
  WAITING_FOR_TEAM: "bg-slate-500",
  RESOLVED: "bg-success",
  CLOSED: "bg-slate-400",
  CANCELLED: "bg-slate-300",
  EXPIRED: "bg-destructive",
}

export { STATUS_DOT }
