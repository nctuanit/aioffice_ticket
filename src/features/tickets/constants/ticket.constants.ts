/** Mirrors `libs/common/src/enums/support-ticket.enum.ts` in open-office; values travel as-is over the API. */
const TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_TEAM",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
  "EXPIRED",
] as const

const TICKET_CATEGORIES = [
  "BUG",
  "ACCOUNT",
  "LICENSE",
  "BILLING",
  "AI_CREDIT",
  "FEATURE_REQUEST",
  "OTHER",
] as const

const TICKET_PRODUCT_MODULES = [
  "WRITER",
  "SENS",
  "MEET",
  "NOTE",
  "ART",
  "MAIL",
  "SLIDE",
  "SHEET",
  "WEB_ADMIN",
] as const

const TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const

const TICKET_SOURCES = ["APP", "WEB_ADMIN"] as const

type TicketStatusCode = (typeof TICKET_STATUSES)[number]

/**
 * Staff transitions, copied from `STAFF_TRANSITIONS` in open-office
 * `libs/common/src/constants/support-ticket.constant.ts`. The backend stays the
 * source of truth (wrong moves get 409); the Hub only uses this to hide/dim options.
 */
const STAFF_TRANSITIONS: Record<TicketStatusCode, readonly TicketStatusCode[]> = {
  OPEN: ["IN_PROGRESS", "WAITING_FOR_USER", "WAITING_FOR_TEAM", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_USER", "WAITING_FOR_TEAM", "RESOLVED", "CANCELLED"],
  WAITING_FOR_USER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  WAITING_FOR_TEAM: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"],
  CANCELLED: [],
  EXPIRED: [],
}

const canStaffTransition = (from: TicketStatusCode, to: TicketStatusCode) =>
  STAFF_TRANSITIONS[from].includes(to)

/** Final statuses: no reply, no assignment, not draggable. */
const FINAL_STATUSES: readonly TicketStatusCode[] = ["CANCELLED", "EXPIRED"]

/** Moving into these asks for confirmation (optionally with a message to the customer). */
const CONFIRM_STATUSES: readonly TicketStatusCode[] = ["RESOLVED", "CLOSED", "CANCELLED"]

/** Kanban columns, left to right. CANCELLED / EXPIRED are not columns. */
const BOARD_COLUMNS = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_TEAM",
  "RESOLVED",
  "CLOSED",
] as const satisfies readonly TicketStatusCode[]

/** Cards loaded per board column (backend max page size is 100). */
const BOARD_COLUMN_LIMIT = 50
/** The CLOSED column only keeps recently closed tickets. */
const BOARD_CLOSED_WINDOW_DAYS = 7

/** Unhandled tickets expire after this many working hours; the queue counts down to it. */
const TICKET_EXPIRY_WORKING_HOURS = 48
/** Below this many remaining working hours the countdown turns amber. */
const TICKET_EXPIRY_WARNING_WORKING_HOURS = 6
/** Below this many remaining working hours the countdown turns red. */
const TICKET_EXPIRY_CRITICAL_WORKING_HOURS = 2

/** Queue / board refetch while the tab is visible (the countdown needs fresh values). */
const QUEUE_REFETCH_INTERVAL_MS = 30_000
/** An open ticket detail refetches the conversation this often. */
const DETAIL_REFETCH_INTERVAL_MS = 30_000

const QUEUE_PAGE_SIZE = 20
const TICKET_BODY_MAX_LENGTH = 5000

export {
  BOARD_CLOSED_WINDOW_DAYS,
  BOARD_COLUMN_LIMIT,
  BOARD_COLUMNS,
  canStaffTransition,
  CONFIRM_STATUSES,
  DETAIL_REFETCH_INTERVAL_MS,
  FINAL_STATUSES,
  QUEUE_PAGE_SIZE,
  QUEUE_REFETCH_INTERVAL_MS,
  STAFF_TRANSITIONS,
  TICKET_BODY_MAX_LENGTH,
  TICKET_CATEGORIES,
  TICKET_EXPIRY_CRITICAL_WORKING_HOURS,
  TICKET_EXPIRY_WARNING_WORKING_HOURS,
  TICKET_EXPIRY_WORKING_HOURS,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
  type TicketStatusCode,
}
