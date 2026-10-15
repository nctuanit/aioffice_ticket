import { Fragment, type ReactNode } from "react"

import { Globe, Inbox, MonitorSmartphone, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { PriorityIndicator, ProductModuleBadge } from "@/features/tickets/components/TicketBadges"
import { isPressingPriority, type NewTicketToastItem } from "@/features/tickets/realtime/new-ticket-toast-item"
import { cn } from "@/lib/utils"

/** Max tickets listed in the grouped toast; the rest is summarised as "+N more". */
const GROUP_ROWS = 3

/**
 * Sonner keeps the toasts stacked behind the front one at the front one's height; like its own
 * styled toasts, their content is hidden (and not clickable) until the stack expands.
 */
const CONTENT_CLASS =
  "flex flex-col gap-1 p-1.5 transition-opacity duration-200 [[data-front=false][data-expanded=false]_&]:pointer-events-none [[data-front=false][data-expanded=false]_&]:opacity-0"

const ROW_BUTTON_CLASS =
  "min-h-11 min-w-0 cursor-pointer rounded-lg px-2.5 text-left transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

const CloseButton = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation("common")
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      aria-label={t("toasts.close")}
      title={t("toasts.close")}
      onClick={onClose}
    >
      <X aria-hidden="true" />
    </Button>
  )
}

/** "Name · [Module] · Category · Source", separators hidden from assistive tech. */
const MetaLine = ({ parts }: { parts: ReactNode[] }) => (
  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
    {parts.map((part, index) => (
      <Fragment key={index}>
        {index > 0 ? <span aria-hidden="true">·</span> : null}
        {part}
      </Fragment>
    ))}
  </span>
)

type NewTicketToastProps = {
  item: NewTicketToastItem
  onOpen: () => void
  onClose: () => void
}

/**
 * One new ticket: the body is a button that opens it (keyboard reachable), plus an explicit
 * "Open" action and a close button. Subject capped at two lines; the meta line only shows
 * what is known (the stream payload alone has no requester, category or priority).
 */
const NewTicketToast = ({ item, onOpen, onClose }: NewTicketToastProps) => {
  const { t } = useTranslation("tickets")
  const SourceGlyph = item.source === "WEB_ADMIN" ? Globe : MonitorSmartphone
  const meta = [
    item.requesterName ? (
      <span key="requester" className="max-w-full truncate font-medium text-foreground">
        {item.requesterName}
      </span>
    ) : null,
    item.productModule ? <ProductModuleBadge key="module" module={item.productModule} /> : null,
    item.category ? <span key="category">{t(`category.${item.category}`)}</span> : null,
    // a web-admin ticket already says "Web admin" in its app tag; don't repeat it as the source
    item.source && !(item.source === "WEB_ADMIN" && item.productModule === "WEB_ADMIN") ? (
      <span key="source" className="inline-flex items-center gap-1">
        <SourceGlyph aria-hidden="true" className="size-3.5" />
        {t(`source.${item.source}`)}
      </span>
    ) : null,
  ].filter(Boolean)

  return (
    <div className={CONTENT_CLASS}>
      <div className="flex items-start gap-1">
        <button type="button" onClick={onOpen} className={cn(ROW_BUTTON_CLASS, "flex flex-1 flex-col gap-1 py-2")}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-foreground">
            <Inbox aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {t("realtime.title", { number: item.ticketNumber })}
            {item.priority && isPressingPriority(item.priority) ? <PriorityIndicator priority={item.priority} /> : null}
          </span>
          <span className="line-clamp-2 text-sm break-words text-foreground">{item.subject}</span>
          {meta.length ? <MetaLine parts={meta} /> : null}
        </button>
        <CloseButton onClose={onClose} />
      </div>
      <div className="flex justify-end px-1.5 pb-1.5">
        <Button onClick={onOpen} aria-label={t("realtime.open_ticket", { number: item.ticketNumber })}>
          {t("realtime.open")}
        </Button>
      </div>
    </div>
  )
}

type NewTicketsGroupToastProps = {
  /** Newest first. */
  items: NewTicketToastItem[]
  onOpenTicket: (ticketId: string) => void
  onViewQueue: () => void
  onClose: () => void
}

/** Several tickets in a burst: up to three rows (each opens its ticket) and a link to the queue. */
const NewTicketsGroupToast = ({ items, onOpenTicket, onViewQueue, onClose }: NewTicketsGroupToastProps) => {
  const { t } = useTranslation("tickets")
  const rows = items.slice(0, GROUP_ROWS)
  const rest = items.length - rows.length

  return (
    <div className={CONTENT_CLASS}>
      <div className="flex items-center gap-1">
        <p className="flex min-w-0 flex-1 items-center gap-2 px-2.5 text-sm font-semibold text-foreground">
          <Inbox aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {t("realtime.group_title", { count: items.length })}
        </p>
        <CloseButton onClose={onClose} />
      </div>
      <ul className="flex flex-col">
        {rows.map((item) => (
          <li key={item.ticketId}>
            <button
              type="button"
              onClick={() => onOpenTicket(item.ticketId)}
              className={cn(ROW_BUTTON_CLASS, "flex w-full items-center gap-2 text-sm")}
            >
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.ticketNumber}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{item.subject}</span>
              {item.priority && isPressingPriority(item.priority) ? (
                <PriorityIndicator priority={item.priority} showLabel={false} />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 px-1.5 pb-1.5">
        {rest > 0 ? <span className="px-1 text-xs text-muted-foreground">{t("realtime.more", { count: rest })}</span> : null}
        <Button className="ml-auto" onClick={onViewQueue}>
          {t("realtime.view_queue")}
        </Button>
      </div>
    </div>
  )
}

export { NewTicketsGroupToast, NewTicketToast }
