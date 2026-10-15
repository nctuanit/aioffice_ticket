import { toast } from "sonner"

import { NewTicketsGroupToast, NewTicketToast } from "@/features/tickets/components/realtime/NewTicketToast"
import { isPressingPriority, type NewTicketToastItem } from "@/features/tickets/realtime/new-ticket-toast-item"

/** A ticket arriving within this long of the previous one joins the grouped toast. */
const GROUP_WINDOW_MS = 5_000
/** Lifetime of a new-ticket toast (paused by sonner while hovered or while the tab is hidden). */
const TOAST_DURATION_MS = 10_000
const TOAST_ID_PREFIX = "ticket-created-"
/** One grouped toast at a time: it is updated in place while tickets keep arriving. */
const GROUP_TOAST_ID = `${TOAST_ID_PREFIX}group`

/**
 * Custom toasts are unstyled, so the card look sits on sonner's `<li>`: stacked toasts behind the
 * front one then show as empty cards like sonner's own (their content is hidden in the component).
 */
const TOAST_CLASS =
  "w-(--width) rounded-xl border border-border bg-card text-card-foreground shadow-lg data-[front=false]:data-[expanded=false]:overflow-hidden"

const singleToastId = (ticketId: string) => `${TOAST_ID_PREFIX}${ticketId}`

/** Still on screen (not closed, swiped away or timed out). */
const isOnScreen = (id: string) => toast.getToasts().some((entry) => entry.id === id)

const durationFor = (items: NewTicketToastItem[]) =>
  items.some((item) => item.priority && isPressingPriority(item.priority)) ? Infinity : TOAST_DURATION_MS

type NewTicketToastsOptions = {
  openTicket: (ticketId: string) => void
  openQueue: () => void
}

/**
 * New-ticket toasts for one stream session. A ticket shows its own toast; when another one
 * arrives within 5 s of the previous one while that toast (or the grouped one) is still on
 * screen, they merge into ONE grouped toast ("N new tickets"), updated in place for as long as
 * the burst lasts. Once the window lapses the next ticket starts over with a single toast.
 * No timers: the window is checked against the previous arrival time. `dispose()` (logout /
 * unmount) closes every new-ticket toast and resets the state.
 */
const createNewTicketToasts = ({ openTicket, openQueue }: NewTicketToastsOptions) => {
  let lastShownAt = Number.NEGATIVE_INFINITY
  let single: NewTicketToastItem | null = null
  let grouped: NewTicketToastItem[] = []

  const openFrom = (toastId: string, ticketId: string) => {
    toast.dismiss(toastId)
    openTicket(ticketId)
  }

  const showSingle = (item: NewTicketToastItem) => {
    toast.custom(
      (id) => (
        <NewTicketToast
          item={item}
          onOpen={() => openFrom(String(id), item.ticketId)}
          onClose={() => toast.dismiss(id)}
        />
      ),
      { id: singleToastId(item.ticketId), duration: durationFor([item]), className: TOAST_CLASS },
    )
  }

  const showGroup = (items: NewTicketToastItem[]) => {
    const newestFirst = [...items].sort((a, b) => b.seq - a.seq)
    toast.custom(
      (id) => (
        <NewTicketsGroupToast
          items={newestFirst}
          onOpenTicket={(ticketId) => openFrom(String(id), ticketId)}
          onViewQueue={() => {
            toast.dismiss(id)
            openQueue()
          }}
          onClose={() => toast.dismiss(id)}
        />
      ),
      // updating the same id restarts sonner's timer, so the group stays 10 s after the last ticket
      { id: GROUP_TOAST_ID, duration: durationFor(newestFirst), className: TOAST_CLASS },
    )
  }

  const show = (item: NewTicketToastItem) => {
    const now = Date.now()
    const withinWindow = now - lastShownAt <= GROUP_WINDOW_MS
    lastShownAt = now
    if (!isOnScreen(GROUP_TOAST_ID)) grouped = []
    const singleOnScreen = single && isOnScreen(singleToastId(single.ticketId)) ? single : null
    const merged = withinWindow
      ? [...grouped, ...(singleOnScreen ? [singleOnScreen] : []), item].filter(
          (entry, index, all) => all.findIndex((other) => other.ticketId === entry.ticketId) === index,
        )
      : [item]
    if (merged.length > 1) {
      if (singleOnScreen) toast.dismiss(singleToastId(singleOnScreen.ticketId))
      single = null
      grouped = merged
      showGroup(merged)
      return
    }
    single = item
    showSingle(item)
  }

  const dispose = () => {
    for (const entry of toast.getToasts()) {
      if (typeof entry.id === "string" && entry.id.startsWith(TOAST_ID_PREFIX)) toast.dismiss(entry.id)
    }
    lastShownAt = Number.NEGATIVE_INFINITY
    single = null
    grouped = []
  }

  return { show, dispose }
}

export { createNewTicketToasts }
