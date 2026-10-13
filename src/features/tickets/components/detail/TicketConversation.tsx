import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { TicketAttachments } from "@/features/tickets/components/detail/TicketAttachments"
import { RelativeTime, UserAvatar } from "@/features/tickets/components/TicketMeta"
import { useTicketMessages } from "@/features/tickets/hooks/useTicketQueries"
import type { Ticket, TicketAttachment, TicketMessage } from "@/features/tickets/types/ticket.types"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/shared/components/ErrorState"

type Entry = {
  id: string
  author: { fullName: string; email: string }
  kind: "customer" | "staff" | "note"
  body: string
  createdAt: string
  attachments: TicketAttachment[]
}

const toEntry = (ticket: Ticket, message: TicketMessage): Entry => {
  const fromRequester = message.senderId === ticket.requesterId
  return {
    id: message.id,
    author: message.sender ?? { fullName: "", email: "—" },
    kind: message.isInternal ? "note" : fromRequester ? "customer" : "staff",
    body: message.body,
    createdAt: message.createdAt,
    attachments: message.attachments,
  }
}

const KIND_STYLE: Record<Entry["kind"], string> = {
  customer: "border-border bg-card",
  staff: "border-primary/20 bg-primary/5",
  note: "border-note-border bg-note",
}

/**
 * Timeline: the original request first, then replies and internal notes in order.
 * Internal notes carry a lock label and a distinct surface so they are never mistaken
 * for something the customer can read.
 */
const TicketConversation = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const messages = useTicketMessages(ticket.id)

  const opening: Entry = {
    id: "opening",
    author: ticket.requester ?? { fullName: "", email: "—" },
    kind: "customer",
    body: ticket.description,
    createdAt: ticket.createdAt,
    attachments: ticket.attachments,
  }
  const entries = [opening, ...(messages.data?.data ?? []).map((message) => toEntry(ticket, message))]

  return (
    <section aria-labelledby="conversation-heading" className="flex flex-col gap-3">
      <h2 id="conversation-heading" className="text-sm font-semibold text-foreground">
        {t("detail.conversation")}
      </h2>
      <ol className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id} className={cn("rounded-xl border p-4", KIND_STYLE[entry.kind])}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <UserAvatar user={entry.author} size="xs" />
              <span className="font-medium text-foreground">{entry.author.fullName || entry.author.email}</span>
              {entry.kind === "note" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 font-medium text-warning">
                  <Lock aria-hidden="true" className="size-3" />
                  {t("detail.internal_note")}
                </span>
              ) : (
                <span>{t(`detail.author_${entry.kind}`)}</span>
              )}
              <span aria-hidden="true">·</span>
              <RelativeTime iso={entry.createdAt} />
            </div>
            <p className="text-sm leading-6 break-words whitespace-pre-wrap text-foreground">{entry.body}</p>
            <TicketAttachments ticketId={ticket.id} attachments={entry.attachments} className="mt-3" />
          </li>
        ))}
      </ol>
      {messages.isPending ? <Skeleton className="h-20 rounded-xl" /> : null}
      {messages.isError ? (
        <ErrorState
          message={apiErrorMessage(messages.error, tAll)}
          onRetry={() => void messages.refetch()}
          retrying={messages.isFetching}
        />
      ) : null}
    </section>
  )
}

export { TicketConversation }
