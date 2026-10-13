import { useRef, useState, type KeyboardEvent } from "react"

import { Lock, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  FINAL_STATUSES,
  TICKET_BODY_MAX_LENGTH,
} from "@/features/tickets/constants/ticket.constants"
import { useSendTicketMessage, type SendMode } from "@/features/tickets/hooks/useTicketMutations"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { cn } from "@/lib/utils"

/**
 * Reply to the customer or leave an internal note. The `clientRequestId` is kept until
 * the send succeeds, so retrying after a timeout cannot post the same text twice.
 */
const TicketComposer = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const [mode, setMode] = useState<SendMode>("reply")
  const [body, setBody] = useState("")
  const requestId = useRef<string>(crypto.randomUUID())
  const send = useSendTicketMessage(ticket.id)
  const locked = FINAL_STATUSES.includes(ticket.status)

  if (locked) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        {t("composer.locked", { status: t(`status.${ticket.status}`) })}
      </p>
    )
  }

  const submit = () => {
    const text = body.trim()
    if (!text || send.isPending) return
    send.mutate(
      { mode, body: text, clientRequestId: requestId.current },
      {
        onSuccess: () => {
          setBody("")
          requestId.current = crypto.randomUUID()
          toast.success(t(mode === "note" ? "toast.note_added" : "toast.reply_sent"))
        },
      },
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      submit()
    }
  }

  const isNote = mode === "note"

  return (
    <section
      aria-label={t("composer.label")}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-3 transition-colors duration-150",
        isNote ? "border-note-border bg-note" : "border-border bg-card",
      )}
    >
      <div role="radiogroup" aria-label={t("composer.mode")} className="flex gap-1">
        {(["reply", "note"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              mode === option ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option === "note" ? <Lock aria-hidden="true" className="size-3.5" /> : null}
            {t(`composer.${option}`)}
          </button>
        ))}
      </div>
      <label htmlFor={`composer-${ticket.id}`} className="sr-only">
        {t(isNote ? "composer.note_placeholder" : "composer.reply_placeholder")}
      </label>
      <Textarea
        id={`composer-${ticket.id}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={TICKET_BODY_MAX_LENGTH}
        rows={4}
        placeholder={t(isNote ? "composer.note_placeholder" : "composer.reply_placeholder")}
        className="bg-card"
      />
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {isNote ? t("composer.note_hint") : t("composer.reply_hint")}
        </p>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {body.length}/{TICKET_BODY_MAX_LENGTH}
        </span>
        <Button onClick={submit} disabled={!body.trim() || send.isPending}>
          <Send aria-hidden="true" />
          {send.isPending ? t("composer.sending") : t(isNote ? "composer.save_note" : "composer.send_reply")}
        </Button>
      </div>
    </section>
  )
}

export { TicketComposer }
