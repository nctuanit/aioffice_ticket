import { useEffect, useRef } from "react"

import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"

/**
 * While the tab is hidden, prefixes the tab title with the number of new tickets / customer
 * messages from the realtime stream ("(3) Ticket Hub"); back to normal once the tab is visible.
 */
const useTitleBadge = () => {
  const unseen = useTicketStreamStore((state) => state.unseen)
  const resetUnseen = useTicketStreamStore((state) => state.resetUnseen)
  const baseTitle = useRef<string | null>(null)

  useEffect(() => {
    baseTitle.current ??= document.title
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetUnseen()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      if (baseTitle.current) document.title = baseTitle.current
    }
  }, [resetUnseen])

  useEffect(() => {
    const base = baseTitle.current ?? document.title
    document.title = unseen > 0 ? `(${unseen > 99 ? "99+" : unseen}) ${base}` : base
  }, [unseen])
}

export { useTitleBadge }
