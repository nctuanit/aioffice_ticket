import { useState, type MouseEvent } from "react"

import { Download, FileText, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAttachmentDownloadUrl } from "@/features/tickets/hooks/useTicketQueries"
import type { TicketAttachment } from "@/features/tickets/types/ticket.types"
import { formatBytes } from "@/features/tickets/utils/format"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"

const isImage = (attachment: TicketAttachment) => attachment.mimeType.startsWith("image/")

/**
 * Image preview: the thumbnail is the (inline) presigned object URL. Presigned URLs
 * live 5 minutes, so a click on a stale link is intercepted: a blank tab is opened
 * synchronously (popup blockers allow that inside the gesture) and pointed at a
 * freshly fetched URL.
 */
const ImageThumbnail = ({ ticketId, attachment }: { ticketId: string; attachment: TicketAttachment }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const url = useAttachmentDownloadUrl(ticketId, attachment.id, true)
  const [retried, setRetried] = useState(false)

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (url.data && !url.isStale) return
    event.preventDefault()
    const popup = window.open("", "_blank")
    void url.refetch().then(({ data, error }) => {
      if (data) popup?.location.replace(data.downloadUrl)
      else {
        popup?.close()
        toast.error(apiErrorMessage(error, tAll))
      }
    })
  }

  /** A URL that expired while the page sat open: fetch a new one once. */
  const onError = () => {
    if (retried) return
    setRetried(true)
    void url.refetch()
  }

  if (url.isError) {
    return (
      <span role="alert" className="text-xs text-destructive">
        {t("attachments.preview_failed", { name: attachment.fileName })}
      </span>
    )
  }
  if (!url.data) {
    return (
      <span className="block size-28 animate-pulse rounded-lg bg-muted">
        <span role="status" className="sr-only">
          {t("common:loading")}
        </span>
      </span>
    )
  }
  return (
    <a
      href={url.data.downloadUrl}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      aria-label={t("attachments.open_image", { name: attachment.fileName })}
      title={`${attachment.fileName} · ${formatBytes(attachment.sizeBytes)}`}
      className="block overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <img src={url.data.downloadUrl} alt="" onError={onError} className="size-28 object-cover" loading="lazy" />
    </a>
  )
}

/**
 * Non-image file: name + size; the link is the presigned download URL (served with
 * `Content-Disposition: attachment`). A stale URL is refreshed on click and the
 * download started with `location.assign`, which keeps the page.
 */
const FileRow = ({ ticketId, attachment }: { ticketId: string; attachment: TicketAttachment }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const url = useAttachmentDownloadUrl(ticketId, attachment.id)
  const [busy, setBusy] = useState(false)

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (url.data && !url.isStale) return
    event.preventDefault()
    setBusy(true)
    void url.refetch().then(({ data, error }) => {
      setBusy(false)
      if (data) window.location.assign(data.downloadUrl)
      else toast.error(apiErrorMessage(error, tAll))
    })
  }

  return (
    <a
      href={url.data?.downloadUrl ?? "#"}
      onClick={onClick}
      aria-disabled={busy || undefined}
      aria-label={t("attachments.download", { name: attachment.fileName })}
      className={cn(
        "inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors duration-150 hover:border-border-strong hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{attachment.fileName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
      {busy ? (
        <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Download aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      )}
    </a>
  )
}

/** Attachments of one message (or of the opening description). Renders nothing when empty. */
const TicketAttachments = ({
  ticketId,
  attachments,
  className,
}: {
  ticketId: string
  attachments: TicketAttachment[] | undefined
  className?: string
}) => {
  const { t } = useTranslation("tickets")
  if (!attachments?.length) return null
  const images = attachments.filter(isImage)
  const files = attachments.filter((attachment) => !isImage(attachment))

  return (
    <div
      role="group"
      aria-label={t("attachments.list_label", { count: attachments.length })}
      className={cn("flex flex-col gap-2", className)}
    >
      {images.length ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((attachment) => (
            <li key={attachment.id}>
              <ImageThumbnail ticketId={ticketId} attachment={attachment} />
            </li>
          ))}
        </ul>
      ) : null}
      {files.length ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((attachment) => (
            <li key={attachment.id} className="max-w-full">
              <FileRow ticketId={ticketId} attachment={attachment} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { TicketAttachments }
