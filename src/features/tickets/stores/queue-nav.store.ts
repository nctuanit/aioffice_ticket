import { create } from "zustand"

const STORAGE_KEY = "ticket-hub.queue-ids"

const readIds = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

type QueueNavState = {
  /** Ticket ids of the queue view the user saw last (list page or board), in display order. */
  ids: string[]
  setIds: (ids: string[]) => void
}

/**
 * Order of the last loaded queue, for "next / previous ticket" in the detail. Mirrored to
 * sessionStorage so a reload of the detail page keeps it; unknown → the navigator hides.
 */
const useQueueNavStore = create<QueueNavState>((set, get) => ({
  ids: readIds(),
  setIds: (ids) => {
    const current = get().ids
    if (current.length === ids.length && current.every((id, index) => id === ids[index])) return
    set({ ids })
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // ignore: navigation still works for this page load
    }
  },
}))

type QueueNeighbours = { index: number; total: number; prev: string | null; next: string | null }

/** Position of a ticket in the last loaded queue, or null when it is not part of it. */
const useQueueNeighbours = (ticketId: string): QueueNeighbours | null => {
  const ids = useQueueNavStore((state) => state.ids)
  const index = ids.indexOf(ticketId)
  if (index < 0) return null
  return {
    index,
    total: ids.length,
    prev: index > 0 ? ids[index - 1] : null,
    next: index < ids.length - 1 ? ids[index + 1] : null,
  }
}

export { useQueueNavStore, useQueueNeighbours, type QueueNeighbours }
