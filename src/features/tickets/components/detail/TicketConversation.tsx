import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"

import { ArrowDown, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { TicketAttachments } from "@/features/tickets/components/detail/TicketAttachments"
import { RelativeTime, UserAvatar } from "@/features/tickets/components/TicketMeta"
import { useTicketMessages } from "@/features/tickets/hooks/useTicketQueries"
import type { Ticket, TicketAttachment, TicketMessage } from "@/features/tickets/types/ticket.types"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/shared/components/ErrorState"

type Entry = {
  id: string
  senderId: string | null
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
    senderId: message.senderId ?? null,
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

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth")

/** Message text clamped to ~12 lines, with "Show more" when it actually overflows. */
const MessageBody = ({ text }: { text: string }) => {
  const { t } = useTranslation("tickets")
  const id = useId()
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || expanded) return
    // fires once on observe and again when the width changes (sheet / window resize)
    const observer = new ResizeObserver(() => setOverflowing(element.scrollHeight > element.clientHeight + 1))
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])

  return (
    <>
      <p
        ref={ref}
        id={id}
        className={cn("text-sm leading-6 break-words whitespace-pre-wrap text-foreground", !expanded && "line-clamp-12")}
      >
        {text}
      </p>
      {overflowing || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          className="-ml-1 mt-1 inline-flex min-h-11 cursor-pointer items-center rounded-md px-1 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? t("detail.show_less") : t("detail.show_more")}
        </button>
      ) : null}
    </>
  )
}

/**
 * Timeline: the original request first, then replies and internal notes in order.
 * Internal notes carry a lock label and a distinct surface so they are never mistaken
 * for something the customer can read. Opens scrolled to the latest message; messages
 * arriving while the reader is scrolled up raise a "New messages" pill instead of jumping.
 */
const TicketConversation = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const messages = useTicketMessages(ticket.id)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const lastEntry = useRef<HTMLLIElement>(null)
  const endSentinel = useRef<HTMLDivElement>(null)
  const atEnd = useRef(true)
  const seenCount = useRef<number | null>(null)
  const [unseen, setUnseen] = useState(0)

  const opening: Entry = {
    id: "opening",
    senderId: ticket.requesterId,
    author: ticket.requester ?? { fullName: "", email: "—" },
    kind: "customer",
    body: ticket.description,
    createdAt: ticket.createdAt,
    attachments: ticket.attachments,
  }
  const loaded = messages.data?.data
  const entries = [opening, ...(loaded ?? []).map((message) => toEntry(ticket, message))]

  // Is the end of the conversation on screen? (works for <main> and the sheet scroller)
  useEffect(() => {
    const sentinel = endSentinel.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => {
      atEnd.current = entry.isIntersecting
      if (entry.isIntersecting) setUnseen(0)
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // First load: jump to the latest message. Later loads: follow along when the reader is at
  // the end (or wrote the message), otherwise count it for the pill.
  const messageList = loaded ?? null
  useLayoutEffect(() => {
    if (!messageList) return
    const count = messageList.length
    const previous = seenCount.current
    seenCount.current = count
    if (previous === null) {
      if (count > 0) lastEntry.current?.scrollIntoView({ block: "end" })
      return
    }
    if (count <= previous) return
    const fresh = messageList.slice(previous)
    const ownOnly = fresh.every((message) => message.senderId && message.senderId === currentUserId)
    if (atEnd.current || ownOnly) {
      lastEntry.current?.scrollIntoView({ block: "end", behavior: scrollBehavior() })
    } else {
      setUnseen((value) => value + fresh.length)
    }
  }, [messageList, currentUserId])

  const jumpToLatest = () => {
    setUnseen(0)
    lastEntry.current?.scrollIntoView({ block: "end", behavior: scrollBehavior() })
  }

  return (
    <section aria-labelledby="conversation-heading" className="flex flex-col">
      <h2 id="conversation-heading" className="text-sm font-semibold text-foreground">
        {t("detail.conversation")}
      </h2>
      <ol className="mt-3 flex flex-col gap-3">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            ref={index === entries.length - 1 ? lastEntry : undefined}
            className={cn("scroll-mb-4 rounded-xl border p-4", KIND_STYLE[entry.kind])}
          >
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
            <MessageBody text={entry.body} />
            <TicketAttachments ticketId={ticket.id} attachments={entry.attachments} className="mt-3" />
          </li>
        ))}
      </ol>
      <div ref={endSentinel} aria-hidden="true" className="h-px" />
      {messages.isPending ? <Skeleton className="mt-3 h-20 rounded-xl" /> : null}
      {messages.isError ? (
        <ErrorState
          className="mt-3"
          message={apiErrorMessage(messages.error, tAll)}
          onRetry={() => void messages.refetch()}
          retrying={messages.isFetching}
        />
      ) : null}
      {/* zero-height sticky rail: the pill floats over the bottom of the scroller while the end is off-screen */}
      <div className="pointer-events-none sticky bottom-4 z-10 flex h-0 justify-center">
        {unseen > 0 ? (
          <button
            type="button"
            onClick={jumpToLatest}
            aria-label={t("detail.new_messages_label", { count: unseen })}
            className="pointer-events-auto inline-flex min-h-11 -translate-y-full cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:animate-[hub-fade-in_150ms_ease-out]"
          >
            {t("detail.new_messages")}
            <ArrowDown aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {unseen > 0 ? t("detail.new_messages_label", { count: unseen }) : ""}
      </p>
    </section>
  )
}

export { TicketConversation }
