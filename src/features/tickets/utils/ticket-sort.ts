/**
 * Queue sort, kept in the URL (`?sort=&order=`) next to the filters. No params means the view's
 * default: newest ticket first, except the "Sắp hết hạn" view (new + unclaimed), which keeps the
 * nearest intake deadline first. The backend breaks ties by the nearest intake deadline and the
 * latest update.
 */
/** Sorts with a column header in the table (and an option in the phone select). */
const TICKET_COLUMN_SORT_FIELDS = ["createdAt", "status", "priority", "assignee", "updatedAt"] as const
/** Everything the URL and `GET /admin/tickets?sortBy=` accept; `deadline` has no column of its own. */
const TICKET_SORT_FIELDS = [...TICKET_COLUMN_SORT_FIELDS, "deadline"] as const
const SORT_DIRECTIONS = ["asc", "desc"] as const

type TicketSortField = (typeof TICKET_SORT_FIELDS)[number]
type SortDirection = (typeof SORT_DIRECTIONS)[number]
type TicketSort = { field: TicketSortField; order: SortDirection }
/** The filters that decide which default sort applies. */
type SortContext = { status?: string; assignee?: string }

const DEFAULT_TICKET_SORT: TicketSort = { field: "createdAt", order: "desc" }
/** Default of the "Sắp hết hạn" view: the ticket whose 48-hour intake deadline runs out first on top. */
const EXPIRING_TICKET_SORT: TicketSort = { field: "deadline", order: "asc" }

/** Direction a column gets on its first click: what staff usually want to see on top. */
const FIRST_DIRECTION: Record<TicketSortField, SortDirection> = {
  createdAt: "desc",
  status: "asc",
  priority: "desc",
  assignee: "asc",
  updatedAt: "desc",
  deadline: "asc",
}

/** Phone select options: every column, its natural direction first (so the default leads the list). */
const COLUMN_SORT_OPTIONS: TicketSort[] = TICKET_COLUMN_SORT_FIELDS.flatMap((field) => {
  const first = FIRST_DIRECTION[field]
  return [
    { field, order: first },
    { field, order: first === "asc" ? "desc" : "asc" },
  ]
})

/** "Sắp hết hạn" quick filter (also reachable via the filter popover): new tickets nobody has claimed. */
const isExpiringPreset = (search: SortContext) => search.status === "OPEN" && search.assignee === "none"

/** Sort applied while the URL has none. */
const defaultTicketSort = (search: SortContext): TicketSort =>
  isExpiringPreset(search) ? EXPIRING_TICKET_SORT : DEFAULT_TICKET_SORT

const resolveTicketSort = (search: SortContext & { sort?: TicketSortField; order?: SortDirection }): TicketSort => {
  if (!search.sort) {
    const fallback = defaultTicketSort(search)
    return { field: fallback.field, order: search.order ?? fallback.order }
  }
  return { field: search.sort, order: search.order ?? FIRST_DIRECTION[search.sort] }
}

/** URL patch for a sort; the view's default clears the params so plain `/tickets` stays clean. */
const ticketSortPatch = (sort: TicketSort, search: SortContext): { sort?: TicketSortField; order?: SortDirection } => {
  const fallback = defaultTicketSort(search)
  return sort.field === fallback.field && sort.order === fallback.order
    ? { sort: undefined, order: undefined }
    : { sort: sort.field, order: sort.order }
}

/** Header click: same column flips the direction, another column starts at its natural direction. */
const nextTicketSort = (current: TicketSort, field: TicketSortField): TicketSort =>
  current.field === field
    ? { field, order: current.order === "asc" ? "desc" : "asc" }
    : { field, order: FIRST_DIRECTION[field] }

const toApiSort = (sort: TicketSort) => ({
  sortBy: sort.field,
  sortOrder: sort.order === "asc" ? ("ASC" as const) : ("DESC" as const),
})

export {
  COLUMN_SORT_OPTIONS,
  DEFAULT_TICKET_SORT,
  isExpiringPreset,
  nextTicketSort,
  resolveTicketSort,
  SORT_DIRECTIONS,
  TICKET_SORT_FIELDS,
  ticketSortPatch,
  toApiSort,
  type SortDirection,
  type TicketSort,
  type TicketSortField,
}
