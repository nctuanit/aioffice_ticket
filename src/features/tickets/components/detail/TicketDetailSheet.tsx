import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { TicketDetailView } from "@/features/tickets/components/detail/TicketDetailView"
import { UnsentDraftDialog } from "@/features/tickets/components/detail/UnsentDraftDialog"
import { useComposerDirtyStore } from "@/features/tickets/stores/composer-dirty.store"

type PendingLeave = { kind: "close" } | { kind: "open"; ticketId: string }

type TicketDetailSheetProps = {
  ticketId: string | null
  onClose: () => void
  /** Next / previous ticket inside the sheet. */
  onOpenTicket?: (ticketId: string) => void
}

/**
 * Ticket detail in a right-hand panel, so the board stays in place behind it. Closing it
 * (Esc, ✕, backdrop) or switching ticket with unsent text in the composer asks first.
 */
const TicketDetailSheet = ({ ticketId, onClose, onOpenTicket }: TicketDetailSheetProps) => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")
  const dirty = useComposerDirtyStore((state) => (ticketId ? Boolean(state.dirty[ticketId]) : false))
  const [pending, setPending] = useState<PendingLeave | null>(null)

  const run = (action: PendingLeave) => {
    if (action.kind === "close") onClose()
    else onOpenTicket?.(action.ticketId)
  }
  const request = (action: PendingLeave) => (dirty ? setPending(action) : run(action))

  return (
    <Dialog open={ticketId !== null} onOpenChange={(open) => !open && request({ kind: "close" })}>
      <DialogContent variant="sheet" closeLabel={tCommon("close")}>
        <DialogTitle className="sr-only">{t("detail.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("detail.sheet_description")}</DialogDescription>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {ticketId ? (
            <TicketDetailView
              ticketId={ticketId}
              variant="sheet"
              onOpenTicket={onOpenTicket ? (id) => request({ kind: "open", ticketId: id }) : undefined}
            />
          ) : null}
        </div>
        <UnsentDraftDialog
          open={pending !== null}
          onStay={() => setPending(null)}
          onLeave={() => {
            const action = pending
            setPending(null)
            if (action) run(action)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export { TicketDetailSheet }
