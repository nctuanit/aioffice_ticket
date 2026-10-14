import { useEffect, useState } from "react"

import type { LucideIcon } from "lucide-react"
import { Check, ChevronLeft, ChevronRight, Hash, Link2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { QueueNeighbours } from "@/features/tickets/stores/queue-nav.store"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { copyText } from "@/lib/clipboard"

const COPIED_FEEDBACK_MS = 1_500

/** Absolute link to the full-page detail (works from the sheet too). */
const ticketUrl = (ticketId: string) => `${window.location.origin}/tickets/${encodeURIComponent(ticketId)}`

type CopyButtonProps = {
  icon: LucideIcon
  label: string
  accessibleLabel: string
  value: string
  successMessage: string
}

/** Copies a value; the icon turns into a check for a moment and a toast confirms it. */
const CopyButton = ({ icon: Icon, label, accessibleLabel, value, successMessage }: CopyButtonProps) => {
  const { t } = useTranslation("tickets")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true)
      toast.success(successMessage)
    } else {
      toast.error(t("detail.copy_failed"))
    }
  }

  const Shown = copied ? Check : Icon
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="min-h-11 px-2.5 sm:px-3"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={() => void copy()}
    >
      <Shown aria-hidden="true" className={copied ? "text-success" : undefined} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

type TicketToolbarProps = {
  ticket: Ticket
  neighbours: QueueNeighbours | null
  onOpenTicket: (ticketId: string) => void
}

/**
 * Header actions of the detail: previous / next ticket in the queue the user came from
 * (hidden when that order is unknown) and copy buttons for the number and the link.
 */
const TicketToolbar = ({ ticket, neighbours, onOpenTicket }: TicketToolbarProps) => {
  const { t } = useTranslation("tickets")
  const prevLabel = t("shortcuts.with_key", { label: t("detail.prev_ticket"), key: "K / ←" })
  const nextLabel = t("shortcuts.with_key", { label: t("detail.next_ticket"), key: "J / →" })

  return (
    <div className="flex flex-wrap items-center gap-1">
      {neighbours ? (
        <nav aria-label={t("detail.queue_nav")} className="mr-1 flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            disabled={!neighbours.prev}
            aria-label={prevLabel}
            title={prevLabel}
            aria-keyshortcuts="K ArrowLeft"
            onClick={() => neighbours.prev && onOpenTicket(neighbours.prev)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
            {t("detail.queue_position", { index: neighbours.index + 1, total: neighbours.total })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            disabled={!neighbours.next}
            aria-label={nextLabel}
            title={nextLabel}
            aria-keyshortcuts="J ArrowRight"
            onClick={() => neighbours.next && onOpenTicket(neighbours.next)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
      <CopyButton
        icon={Hash}
        label={t("detail.copy_number")}
        accessibleLabel={t("detail.copy_number_label", { number: ticket.ticketNumber })}
        value={ticket.ticketNumber}
        successMessage={t("detail.copied_number", { number: ticket.ticketNumber })}
      />
      <CopyButton
        icon={Link2}
        label={t("detail.copy_link")}
        accessibleLabel={t("detail.copy_link_label", { number: ticket.ticketNumber })}
        value={ticketUrl(ticket.id)}
        successMessage={t("detail.copied_link")}
      />
    </div>
  )
}

export { TicketToolbar }
