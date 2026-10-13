import { z } from "zod"

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
} from "@/features/tickets/constants/ticket.constants"

/**
 * `/tickets` search params. Filters live in the URL so a filtered view (list or board)
 * can be shared and survives reloads. Invalid values are dropped instead of failing the route.
 */
const ticketListSearchSchema = z.object({
  view: z.enum(["list", "board"]).optional().catch(undefined),
  status: z.enum(TICKET_STATUSES).optional().catch(undefined),
  assignee: z.enum(["me", "none"]).optional().catch(undefined),
  /** `me` → only tickets the current user is tagged on. */
  participant: z.enum(["me"]).optional().catch(undefined),
  category: z.enum(TICKET_CATEGORIES).optional().catch(undefined),
  productModule: z.enum(TICKET_PRODUCT_MODULES).optional().catch(undefined),
  priority: z.enum(TICKET_PRIORITIES).optional().catch(undefined),
  source: z.enum(TICKET_SOURCES).optional().catch(undefined),
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

type TicketListSearch = z.infer<typeof ticketListSearchSchema>

/** Filters shared by the list and the board (everything except view / status / page). */
type TicketBoardFilters = Omit<TicketListSearch, "view" | "status" | "page">

const pickBoardFilters = (search: TicketListSearch): TicketBoardFilters => ({
  assignee: search.assignee,
  participant: search.participant,
  category: search.category,
  productModule: search.productModule,
  priority: search.priority,
  source: search.source,
  q: search.q,
})

export { pickBoardFilters, ticketListSearchSchema, type TicketBoardFilters, type TicketListSearch }
