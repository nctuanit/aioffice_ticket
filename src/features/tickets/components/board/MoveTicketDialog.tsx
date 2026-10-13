import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  TICKET_BODY_MAX_LENGTH,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import type { Ticket } from "@/features/tickets/types/ticket.types"

type PendingMove = { ticket: Ticket; to: TicketStatusCode }

type MoveTicketDialogProps = {
  pending: PendingMove | null
  submitting: boolean
  onCancel: () => void
  onConfirm: (move: PendingMove, message: string) => void
}

/**
 * Confirms moves into RESOLVED / CLOSED / CANCELLED, with an optional public message to
 * the customer (sent before the status change). Remounted per move, so it starts empty.
 */
const MoveTicketDialog = ({ pending, submitting, onCancel, onConfirm }: MoveTicketDialogProps) => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")
  const [message, setMessage] = useState("")

  if (!pending) return null
  const statusLabel = t(`status.${pending.to}`)
  const allowMessage = pending.to !== "CANCELLED"

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onCancel()}>
      <DialogContent closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle>{t("board.confirm_title", { status: statusLabel })}</DialogTitle>
          <DialogDescription>
            {t(`board.confirm_body_${pending.to === "CANCELLED" ? "cancel" : "resolve"}`, {
              number: pending.ticket.ticketNumber,
              subject: pending.ticket.subject,
            })}
          </DialogDescription>
        </DialogHeader>
        {allowMessage ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="move-message">{t("board.confirm_message_label")}</Label>
            <Textarea
              id="move-message"
              value={message}
              maxLength={TICKET_BODY_MAX_LENGTH}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("board.confirm_message_placeholder")}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{t("board.confirm_message_hint")}</p>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={() => onConfirm(pending, allowMessage ? message : "")} disabled={submitting}>
            {submitting ? tCommon("saving") : t("board.confirm_action", { status: statusLabel })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { MoveTicketDialog, type PendingMove }
