import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from "react"

import { useBlocker } from "@tanstack/react-router"
import { Check, Film, Loader2, Lock, Paperclip, Send, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CannedRepliesMenu } from "@/features/tickets/components/detail/CannedRepliesMenu"
import { UnsentDraftDialog } from "@/features/tickets/components/detail/UnsentDraftDialog"
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENTS_PER_MESSAGE,
  isVideoMime,
} from "@/features/tickets/constants/attachment.constants"
import {
  FINAL_STATUSES,
  TICKET_BODY_MAX_LENGTH,
} from "@/features/tickets/constants/ticket.constants"
import { useAttachmentUpload, type PendingUpload } from "@/features/tickets/hooks/useAttachmentUpload"
import { useSendTicketMessage, type SendMode } from "@/features/tickets/hooks/useTicketMutations"
import { useComposerDirtyStore } from "@/features/tickets/stores/composer-dirty.store"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { clearDraft, readDraft, writeDraft } from "@/features/tickets/utils/drafts"
import { formatBytes } from "@/features/tickets/utils/format"
import { cn } from "@/lib/utils"

/** Imperative entry points for the detail shortcuts (`r` / `n`). */
type ComposerHandle = {
  /** Switch to the mode and put the caret at the end of its text. */
  focus: (mode: SendMode) => void
}

const DRAFT_SAVE_DEBOUNCE_MS = 400

const MODE_SHORTCUT: Record<SendMode, string> = { reply: "R", note: "N" }

/** One picked file: name, size and upload state; errors stay visible until removed. */
const UploadChip = ({ upload, onRemove }: { upload: PendingUpload; onRemove: () => void }) => {
  const { t } = useTranslation("tickets")
  const failed = upload.status === "error"
  const Icon = isVideoMime(upload.file.type) ? Film : Paperclip
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
        <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
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

type Drafts = Record<SendMode, string>

/**
 * The editable composer for one ticket (remounted per ticket). Text is autosaved per
 * ticket and mode to localStorage, restored on open and cleared once the send succeeds.
 * Leaving with unsent text (route change, tab close) asks first.
 */
const ComposerForm = ({ ticket, ref }: { ticket: Ticket; ref?: Ref<ComposerHandle> }) => {
  const { t } = useTranslation("tickets")
  const ticketId = ticket.id
  const [texts, setTexts] = useState<Drafts>(() => ({
    reply: readDraft(ticketId, "reply"),
    note: readDraft(ticketId, "note"),
  }))
  const [saved, setSaved] = useState<Drafts>(texts)
  // a lone internal-note draft reopens in note mode
  const [mode, setMode] = useState<SendMode>(() => (!texts.reply.trim() && texts.note.trim() ? "note" : "reply"))
  const requestId = useRef<string>(crypto.randomUUID())
  const fileInput = useRef<HTMLInputElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  /** The user has placed the caret, so snippets go there (otherwise they are appended). */
  const caretPlaced = useRef(false)
  const pendingCaret = useRef<number | null>(null)
  const latestTexts = useRef(texts)
  const send = useSendTicketMessage(ticketId)
  const attachments = useAttachmentUpload()
  const setDirty = useComposerDirtyStore((state) => state.setDirty)

  const body = texts[mode]
  const isNote = mode === "note"
  const dirty = Boolean(texts.reply.trim() || texts.note.trim() || attachments.uploads.length)
  const canSend = Boolean(body.trim()) && !send.isPending && !attachments.uploading && !attachments.failed
  const draftSaved = Boolean(body.trim()) && body === saved[mode]

  const setBody = (value: string) => setTexts((previous) => ({ ...previous, [mode]: value }))

  // debounced autosave of both modes
  useEffect(() => {
    latestTexts.current = texts
    if (texts.reply === saved.reply && texts.note === saved.note) return
    const timer = window.setTimeout(() => {
      const ok = writeDraft(ticketId, "reply", texts.reply) && writeDraft(ticketId, "note", texts.note)
      if (ok) setSaved(texts)
    }, DRAFT_SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [texts, saved, ticketId])

  // flush what the debounce has not written yet when the composer goes away
  useEffect(
    () => () => {
      writeDraft(ticketId, "reply", latestTexts.current.reply)
      writeDraft(ticketId, "note", latestTexts.current.note)
    },
    [ticketId],
  )

  useEffect(() => {
    setDirty(ticketId, dirty)
  }, [dirty, setDirty, ticketId])
  useEffect(() => () => setDirty(ticketId, false), [setDirty, ticketId])

  // route changes away from this ticket and closing the tab ask first
  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => next.pathname !== `/tickets/${ticketId}`,
    enableBeforeUnload: dirty,
    disabled: !dirty,
    withResolver: true,
  })

  // caret after an inserted snippet
  useLayoutEffect(() => {
    const caret = pendingCaret.current
    if (caret === null) return
    pendingCaret.current = null
    textarea.current?.setSelectionRange(caret, caret)
  }, [body])

  useImperativeHandle(
    ref,
    () => ({
      focus: (next) => {
        setMode(next)
        requestAnimationFrame(() => {
          const element = textarea.current
          if (!element) return
          element.focus()
          element.setSelectionRange(element.value.length, element.value.length)
        })
      },
    }),
    [],
  )

  const insertSnippet = (snippet: string) => {
    const element = textarea.current
    const start = caretPlaced.current && element ? element.selectionStart : body.length
    const end = caretPlaced.current && element ? element.selectionEnd : body.length
    const before = body.slice(0, start)
    const piece = (before && !before.endsWith("\n") ? "\n" : "") + snippet
    const next = (before + piece + body.slice(end)).slice(0, TICKET_BODY_MAX_LENGTH)
    pendingCaret.current = Math.min(before.length + piece.length, next.length)
    caretPlaced.current = true
    setBody(next)
  }

  const submit = () => {
    if (!canSend) return
    const sentMode = mode
    send
      .mutateAsync({
        mode: sentMode,
        body: body.trim(),
        clientRequestId: requestId.current,
        attachmentIds: attachments.confirmedIds,
      })
      .then(() => {
        clearDraft(ticketId, sentMode)
        setTexts((previous) => ({ ...previous, [sentMode]: "" }))
        setSaved((previous) => ({ ...previous, [sentMode]: "" }))
        attachments.reset()
        requestId.current = crypto.randomUUID()
        toast.success(t(sentMode === "note" ? "toast.note_added" : "toast.reply_sent"))
      })
      .catch(() => undefined) // the mutation hook already shows the error toast
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
            aria-keyshortcuts={MODE_SHORTCUT[option]}
            title={t("shortcuts.with_key", { label: t(`composer.${option}`), key: MODE_SHORTCUT[option] })}
            onClick={() => setMode(option)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              mode === option ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option === "note" ? <Lock aria-hidden="true" className="size-3.5" /> : null}
            {t(`composer.${option}`)}
            {option !== mode && texts[option].trim() ? (
              <span className="size-1.5 rounded-full bg-primary" title={t("composer.has_draft")}>
                <span className="sr-only">{t("composer.has_draft")}</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <label htmlFor={`composer-${ticketId}`} className="sr-only">
        {t(isNote ? "composer.note_placeholder" : "composer.reply_placeholder")}
      </label>
      <Textarea
        ref={textarea}
        id={`composer-${ticketId}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={onKeyDown}
        onSelect={() => {
          caretPlaced.current = true
        }}
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
      <div className="flex flex-wrap items-center gap-2">
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => fileInput.current?.click()}
          disabled={send.isPending}
        >
          <Paperclip aria-hidden="true" />
          {t("attachments.attach")}
        </Button>
        <CannedRepliesMenu
          ticket={ticket}
          disabled={send.isPending}
          onInsert={insertSnippet}
          onAfterInsert={() => textarea.current?.focus()}
        />
        <p className="basis-full text-xs text-muted-foreground sm:basis-auto sm:flex-1">
          {isNote ? t("composer.note_hint") : t("composer.reply_hint")} {t("attachments.limits_hint")}
        </p>
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span aria-live="polite" className="inline-flex min-w-0 items-center gap-1">
            {draftSaved ? (
              <>
                <Check aria-hidden="true" className="size-3.5" />
                {t("composer.draft_saved")}
              </>
            ) : null}
          </span>
          <span className="tabular-nums">
            {body.length}/{TICKET_BODY_MAX_LENGTH}
          </span>
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
      <UnsentDraftDialog
        open={blocker.status === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </section>
  )
}

/**
 * Reply to the customer or leave an internal note, optionally with attachments
 * (presign → PUT → confirm before the message is posted). The `clientRequestId` is
 * kept until the send succeeds, so retrying after a timeout cannot post the same text twice.
 */
const TicketComposer = ({ ticket, ref }: { ticket: Ticket; ref?: Ref<ComposerHandle> }) => {
  const { t } = useTranslation("tickets")

  if (FINAL_STATUSES.includes(ticket.status)) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        {t("composer.locked", { status: t(`status.${ticket.status}`) })}
      </p>
    )
  }

  return <ComposerForm key={ticket.id} ticket={ticket} ref={ref} />
}

export { TicketComposer, type ComposerHandle }
