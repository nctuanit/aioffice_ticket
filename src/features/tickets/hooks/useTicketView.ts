import type { TicketView } from "@/features/tickets/components/queue/ViewSwitcher"

const STORAGE_KEY = "ticket-hub.queue-view"

/** Last chosen view; storage can be unavailable (private mode), so every access is guarded. */
const readStoredView = (): TicketView | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === "list" || value === "board" ? value : null
  } catch {
    return null
  }
}

const storeView = (view: TicketView) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, view)
  } catch {
    // ignore: the view still comes from the URL
  }
}

export { readStoredView, storeView }
