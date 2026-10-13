import { useRef, useState, type KeyboardEvent } from "react"

import { Loader2, Lock, Paperclip, Send, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENTS_PER_MESSAGE,
} from "@/features/tickets/constants/attachment.constants"
import {
  FINAL_STATUSES,
  TICKET_BODY_MAX_LENGTH,
} from "@/features/tickets/constants/ticket.constants"
import { useAttachmentUpload, type PendingUpload } from "@/features/tickets/hooks/useAttachmentUpload"
import { useSendTicketMessage, type SendMode } from "@/features/tickets/hooks/useTicketMutations"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { formatBytes } from "@/features/tickets/utils/format"
import { cn } from "@/lib/utils"

/** One picked file: name, size and upload state; errors stay visible until removed. */
const UploadChip = ({ upload, onRemove }: { upload: PendingUpload; onRemove: () => void }) => {
  const { t } = useTranslation("tickets")
  const failed = upload.status === "error"
  return (
    <li
      className={cn(
        "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg border pl-2.5 pr-0.5 text-xs",
        failed ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-card text-foreground",
      )}
    >
      {upload.status === "uploading" ? (
        <Loader2 aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Paperclip aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{upload.file.name}</span>
      <span className="shrink-0 text-muted-foreground">{formatBytes(upload.file.size)}</span>
      {failed ? (
        <span role="alert" className="shrink-0">
          · {upload.error}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("attachments.remove", { name: upload.file.name })}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  )
}

/**
 * Reply to the customer or leave an internal note, optionally with attachments
 * (presign → PUT → confirm before the message is posted). The `clientRequestId` is
 * kept until the send succeeds, so retrying after a timeout cannot post the same text twice.
 */
const TicketComposer = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const [mode, setMode] = useState<SendMode>("reply")
  const [body, setBody] = useState("")
  const requestId = useRef<string>(crypto.randomUUID())
  const fileInput = useRef<HTMLInputElement>(null)
  const send = useSendTicketMessage(ticket.id)
  const attachments = useAttachmentUpload()
  const locked = FINAL_STATUSES.includes(ticket.status)

  if (locked) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        {t("composer.locked", { status: t(`status.${ticket.status}`) })}
      </p>
    )
  }

  const canSend = Boolean(body.trim()) && !send.isPending && !attachments.uploading && !attachments.failed

  const submit = () => {
    if (!canSend) return
    send.mutate(
      { mode, body: body.trim(), clientRequestId: requestId.current, attachmentIds: attachments.confirmedIds },
      {
        onSuccess: () => {
          setBody("")
          attachments.reset()
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

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return
    const { overflow, duplicates } = attachments.addFiles(files)
    if (overflow) toast.info(t("attachments.too_many", { count: ATTACHMENTS_PER_MESSAGE }))
    if (duplicates) toast.info(t("attachments.duplicate_skipped", { count: duplicates }))
    if (fileInput.current) fileInput.current.value = ""
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
      {attachments.uploads.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("attachments.pending_label")}>
          {attachments.uploads.map((upload) => (
            <UploadChip key={upload.localId} upload={upload} onRemove={() => attachments.remove(upload.localId)} />
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => pickFiles(event.target.files)}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={send.isPending}>
          <Paperclip aria-hidden="true" />
          {t("attachments.attach")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isNote ? t("composer.note_hint") : t("composer.reply_hint")} {t("attachments.limits_hint")}
        </p>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {body.length}/{TICKET_BODY_MAX_LENGTH}
        </span>
        <Button onClick={submit} disabled={!canSend}>
          <Send aria-hidden="true" />
          {send.isPending
            ? t("composer.sending")
            : attachments.uploading
              ? t("attachments.uploading")
              : attachments.failed
                ? t("attachments.fix_failed")
                : t(isNote ? "composer.save_note" : "composer.send_reply")}
        </Button>
      </div>
    </section>
  )
}

export { TicketComposer }
