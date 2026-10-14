/**
 * Queue sort, kept in the URL (`?sort=&order=`) next to the filters. No params means the
 * default: priority high → low (the backend then breaks ties by the nearest intake
 * deadline and the latest update).
 */
const TICKET_SORT_FIELDS = ["createdAt", "status", "priority", "assignee", "updatedAt"] as const
const SORT_DIRECTIONS = ["asc", "desc"] as const

type TicketSortField = (typeof TICKET_SORT_FIELDS)[number]
type SortDirection = (typeof SORT_DIRECTIONS)[number]
type TicketSort = { field: TicketSortField; order: SortDirection }

const DEFAULT_TICKET_SORT: TicketSort = { field: "priority", order: "desc" }

/** Direction a column gets on its first click: what staff usually want to see on top. */
const FIRST_DIRECTION: Record<TicketSortField, SortDirection> = {
  createdAt: "desc",
  status: "asc",
  priority: "desc",
  assignee: "asc",
  updatedAt: "desc",
}

const resolveTicketSort = (search: { sort?: TicketSortField; order?: SortDirection }): TicketSort => {
  if (!search.sort) return { field: DEFAULT_TICKET_SORT.field, order: search.order ?? DEFAULT_TICKET_SORT.order }
  return { field: search.sort, order: search.order ?? FIRST_DIRECTION[search.sort] }
}

/** URL patch for a sort; the default sort clears the params so plain `/tickets` stays clean. */
const ticketSortPatch = (sort: TicketSort): { sort?: TicketSortField; order?: SortDirection } =>
  sort.field === DEFAULT_TICKET_SORT.field && sort.order === DEFAULT_TICKET_SORT.order
    ? { sort: undefined, order: undefined }
    : { sort: sort.field, order: sort.order }

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
  DEFAULT_TICKET_SORT,
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
