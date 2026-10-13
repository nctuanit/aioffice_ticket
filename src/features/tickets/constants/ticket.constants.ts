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

/** Unhandled tickets expire after this many working hours; the queue counts down to it. */
const TICKET_EXPIRY_WORKING_HOURS = 48
/** Below this many remaining working hours the row is flagged as urgent. */
const TICKET_EXPIRY_WARNING_WORKING_HOURS = 6

/** Queue refetch while the tab is visible (the countdown needs fresh `expiresAt`). */
const QUEUE_REFETCH_INTERVAL_MS = 30_000

export {
  QUEUE_REFETCH_INTERVAL_MS,
  TICKET_CATEGORIES,
  TICKET_EXPIRY_WARNING_WORKING_HOURS,
  TICKET_EXPIRY_WORKING_HOURS,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
}
