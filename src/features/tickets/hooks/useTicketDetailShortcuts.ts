import { useEffect, useRef, type RefObject } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { ComposerHandle } from "@/features/tickets/components/detail/TicketComposer"
import { FINAL_STATUSES } from "@/features/tickets/constants/ticket.constants"
import { useClaimTicket } from "@/features/tickets/hooks/useTicketMutations"
import type { QueueNeighbours } from "@/features/tickets/stores/queue-nav.store"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { hasOverlayOutside, isPlainKey, isTypingTarget } from "@/lib/keyboard"

type DetailShortcutOptions = {
  /** Root of the detail view; overlays outside it (a confirm dialog, a menu) pause the shortcuts. */
  root: RefObject<HTMLElement | null>
  ticket: Ticket | undefined
  composer: RefObject<ComposerHandle | null>
  neighbours: QueueNeighbours | null
  onOpenTicket: (ticketId: string) => void
}

/**
 * Detail shortcuts (ignored while typing): `r` reply, `n` internal note, `c` claim when
 * unassigned, `j` / `→` next and `k` / `←` previous ticket of the queue order.
 */
const useTicketDetailShortcuts = ({ root, ticket, composer, neighbours, onOpenTicket }: DetailShortcutOptions) => {
  const { t } = useTranslation("tickets")
  const claim = useClaimTicket()
  const latest = useRef({ ticket, neighbours, onOpenTicket, claim, t })

  useEffect(() => {
    latest.current = { ticket, neighbours, onOpenTicket, claim, t }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || !isPlainKey(event) || event.shiftKey) return
      if (isTypingTarget(event.target) || hasOverlayOutside(root.current)) return
      const { ticket: current, neighbours: around, onOpenTicket: open, claim: claimMutation, t: translate } = latest.current
      if (!current) return
      const locked = FINAL_STATUSES.includes(current.status)

      switch (event.key) {
        case "r":
        case "n":
          if (locked || !composer.current) return
          event.preventDefault()
          composer.current.focus(event.key === "r" ? "reply" : "note")
          return
        case "c":
          if (locked || claimMutation.isPending) return
          event.preventDefault()
          if (current.assigneeId) toast.info(translate("detail.already_assigned"))
          else claimMutation.mutate(current.id)
          return
        case "j":
        case "ArrowRight":
          if (!around?.next) return
          event.preventDefault()
          open(around.next)
          return
        case "k":
        case "ArrowLeft":
          if (!around?.prev) return
          event.preventDefault()
          open(around.prev)
          return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [root, composer])
}

export { useTicketDetailShortcuts }
