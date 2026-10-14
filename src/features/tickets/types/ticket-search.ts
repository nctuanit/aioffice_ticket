import { z } from "zod"

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
} from "@/features/tickets/constants/ticket.constants"
import { SORT_DIRECTIONS, TICKET_SORT_FIELDS } from "@/features/tickets/utils/ticket-sort"

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
  /**
   * "Customer replied" quick filter. Client-side only (the list API has no such filter):
   * it narrows the tickets already loaded on screen and is never sent to the backend.
   */
  replied: z.boolean().optional().catch(undefined),
  /** List sort; absent → priority high → low (see `resolveTicketSort`). */
  sort: z.enum(TICKET_SORT_FIELDS).optional().catch(undefined),
  order: z.enum(SORT_DIRECTIONS).optional().catch(undefined),
})

type TicketListSearch = z.infer<typeof ticketListSearchSchema>

/** Server-side filters shared by the list and the board (everything except view / status / page / replied / sort). */
type TicketBoardFilters = Omit<TicketListSearch, "view" | "status" | "page" | "replied" | "sort" | "order">

/** A change to the URL filters (view and page are handled by the caller). */
type FilterPatch = Partial<Omit<TicketListSearch, "view" | "page">>

/** Patch that resets every filter. */
const CLEAR_ALL_FILTERS: FilterPatch = {
  q: undefined,
  status: undefined,
  assignee: undefined,
  participant: undefined,
  category: undefined,
  productModule: undefined,
  priority: undefined,
  source: undefined,
  replied: undefined,
}

/** Any filter set (status counts only where the status filter is shown). */
const hasActiveFilters = (search: TicketListSearch, includeStatus = true) =>
  Boolean(
    search.q ||
      search.assignee ||
      search.participant ||
      search.category ||
      search.productModule ||
      search.priority ||
      search.source ||
      search.replied ||
      (includeStatus && search.status),
  )

const pickBoardFilters = (search: TicketListSearch): TicketBoardFilters => ({
  assignee: search.assignee,
  participant: search.participant,
  category: search.category,
  productModule: search.productModule,
  priority: search.priority,
  source: search.source,
  q: search.q,
})

export {
  CLEAR_ALL_FILTERS,
  hasActiveFilters,
  pickBoardFilters,
  ticketListSearchSchema,
  type FilterPatch,
  type TicketBoardFilters,
  type TicketListSearch,
}
