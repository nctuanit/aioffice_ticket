import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { ExpiryCountdown } from "@/features/tickets/components/TicketMeta"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { formatDateTime } from "@/features/tickets/utils/format"

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-sm break-words text-foreground sm:text-right">{children}</dd>
  </div>
)

/** Who / where / when. The deadline row only shows while nobody has handled the ticket. */
const TicketInfo = ({ ticket }: { ticket: Ticket }) => {
  const { t, i18n } = useTranslation("tickets")
  const locale = i18n.resolvedLanguage ?? "vi"
  const date = (iso?: string | null) => (iso ? formatDateTime(iso, locale) : "—")

  return (
    <section aria-label={t("detail.info")} className="rounded-xl border border-border bg-card px-4 py-2">
      <dl className="divide-y divide-border">
        <Row label={t("fields.requester")}>
          <span className="block font-medium">{ticket.requester?.fullName || "—"}</span>
          {ticket.requester?.email ? (
            <a href={`mailto:${ticket.requester.email}`} className="text-xs text-primary hover:underline">
              {ticket.requester.email}
            </a>
          ) : null}
        </Row>
        {ticket.workspace ? <Row label={t("fields.workspace")}>{ticket.workspace.name}</Row> : null}
        <Row label={t("fields.source")}>{t(`source.${ticket.source}`)}</Row>
        <Row label={t("fields.category")}>{t(`category.${ticket.category}`)}</Row>
        {ticket.productModule ? <Row label={t("fields.module")}>{t(`module.${ticket.productModule}`)}</Row> : null}
        <Row label={t("fields.created")}>{date(ticket.createdAt)}</Row>
        {ticket.expiresAt && !ticket.firstHandledAt ? (
          <Row label={t("fields.deadline")}>
            <span className="inline-flex flex-col items-end gap-1">
              <ExpiryCountdown ticket={ticket} />
              <span className="text-xs text-muted-foreground">{date(ticket.expiresAt)}</span>
            </span>
          </Row>
        ) : null}
        {ticket.firstHandledAt ? <Row label={t("fields.first_handled")}>{date(ticket.firstHandledAt)}</Row> : null}
        {ticket.resolvedAt ? <Row label={t("fields.resolved")}>{date(ticket.resolvedAt)}</Row> : null}
        {ticket.closedAt ? <Row label={t("fields.closed")}>{date(ticket.closedAt)}</Row> : null}
        {ticket.expiredAt ? <Row label={t("fields.expired")}>{date(ticket.expiredAt)}</Row> : null}
      </dl>
    </section>
  )
}

export { TicketInfo }
