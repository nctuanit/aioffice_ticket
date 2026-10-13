import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { TicketDetailView } from "@/features/tickets/components/detail/TicketDetailView"

/** Ticket detail in a right-hand panel, so the board stays in place behind it. */
const TicketDetailSheet = ({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")

  return (
    <Dialog open={ticketId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent variant="sheet" closeLabel={tCommon("close")}>
        <DialogTitle className="sr-only">{t("detail.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("detail.sheet_description")}</DialogDescription>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {ticketId ? <TicketDetailView ticketId={ticketId} variant="sheet" /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { TicketDetailSheet }
