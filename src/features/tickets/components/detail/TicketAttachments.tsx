import { useRef, useState, type MouseEvent } from "react"

import { Download, FileText, FileX, Film, ImageOff, Loader2, RotateCw, VideoOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { RelativeTime } from "@/features/tickets/components/TicketMeta"
import { isImageMime, isPurgedAttachment, isVideoMime } from "@/features/tickets/constants/attachment.constants"
import { useAttachmentDownloadUrl } from "@/features/tickets/hooks/useTicketQueries"
import type { TicketAttachment } from "@/features/tickets/types/ticket.types"
import { formatBytes } from "@/features/tickets/utils/format"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"

type AttachmentProps = { ticketId: string; attachment: TicketAttachment }

/**
 * Shown instead of the browser's broken-image / dead-player box once a preview still
 * fails after the one automatic URL refetch (or the URL itself could not be fetched).
 */
const FailedTile = ({
  attachment,
  retrying,
  onRetry,
  className,
}: {
  attachment: TicketAttachment
  retrying: boolean
  onRetry: () => void
  className?: string
}) => {
  const { t } = useTranslation("tickets")
  return (
    <div
      role="alert"
      title={attachment.fileName}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong bg-muted p-2 text-center",
        className,
      )}
    >
      <ImageOff aria-hidden="true" className="size-5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{t("attachments.load_failed")}</span>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        aria-label={t("attachments.retry_load", { name: attachment.fileName })}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium text-primary transition-colors duration-150 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default disabled:opacity-60"
      >
        {retrying ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
        ) : (
          <RotateCw aria-hidden="true" className="size-3.5" />
        )}
        {t("common:retry")}
      </button>
    </div>
  )
}

const PreviewSkeleton = ({ className }: { className?: string }) => {
  const { t } = useTranslation("tickets")
  return (
    <span className={cn("block animate-pulse rounded-lg bg-muted motion-reduce:animate-none", className)}>
      <span role="status" className="sr-only">
        {t("common:loading")}
      </span>
    </span>
  )
}

/**
 * Image preview: the thumbnail is the (inline) presigned object URL. Presigned URLs
 * live 5 minutes, so a click on a stale link is intercepted: a blank tab is opened
 * synchronously (popup blockers allow that inside the gesture) and pointed at a
 * freshly fetched URL. A load error refetches the URL once; if that still fails the
 * fallback tile offers a manual retry.
 */
const ImageThumbnail = ({ ticketId, attachment }: AttachmentProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const url = useAttachmentDownloadUrl(ticketId, attachment.id, true)
  const [retried, setRetried] = useState(false)
  const [failed, setFailed] = useState(false)

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

  /** A URL that expired while the page sat open: fetch a new one once, then give up visibly. */
  const onError = () => {
    if (retried) {
      setFailed(true)
      return
    }
    setRetried(true)
    void url.refetch()
  }

  const retry = () => {
    void url.refetch().then(({ data }) => {
      if (data) {
        setRetried(false)
        setFailed(false)
      }
    })
  }

  if (url.isError || failed) {
    return (
      <FailedTile attachment={attachment} retrying={url.isFetching} onRetry={retry} className="size-28" />
    )
  }
  if (!url.data) return <PreviewSkeleton className="size-28" />
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
 * Non-image file (and the download link under a video): name + size; the link is the
 * presigned download URL (served with `Content-Disposition: attachment`). A stale URL
 * is refreshed on click and the download started with `location.assign`, which keeps the page.
 */
const FileRow = ({ ticketId, attachment }: AttachmentProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const url = useAttachmentDownloadUrl(ticketId, attachment.id)
  const [busy, setBusy] = useState(false)
  const Icon = isVideoMime(attachment.mimeType) ? Film : FileText

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
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
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

/**
 * Inline video: `<video controls preload="metadata">` on the inline presigned URL (the
 * browser streams it with Range requests). The `src` is pinned once metadata loads so a
 * background URL refresh never restarts playback; when the URL expires mid-session the
 * player errors, a new URL is fetched once and playback resumes where it was. A second
 * failure shows the fallback tile. The download link sits underneath.
 */
const VideoAttachment = ({ ticketId, attachment }: AttachmentProps) => {
  const { t } = useTranslation("tickets")
  const url = useAttachmentDownloadUrl(ticketId, attachment.id, true)
  const [pinned, setPinned] = useState<string>()
  const [failed, setFailed] = useState(false)
  const retried = useRef(false)
  const resumeAt = useRef(0)
  const src = pinned ?? url.data?.downloadUrl

  const refresh = () =>
    url.refetch().then(({ data }) => {
      if (data) {
        setPinned(data.downloadUrl)
        setFailed(false)
      } else setFailed(true)
    })

  const onError = (event: { currentTarget: HTMLVideoElement }) => {
    if (retried.current) {
      setFailed(true)
      return
    }
    retried.current = true
    resumeAt.current = event.currentTarget.currentTime
    void refresh()
  }

  const onLoadedMetadata = (event: { currentTarget: HTMLVideoElement }) => {
    const video = event.currentTarget
    if (!pinned) setPinned(video.currentSrc || src)
    if (resumeAt.current > 0) {
      video.currentTime = resumeAt.current
      resumeAt.current = 0
    }
  }

  const retry = () => {
    retried.current = false
    void refresh()
  }

  const player =
    url.isError || failed ? (
      <FailedTile
        attachment={attachment}
        retrying={url.isFetching}
        onRetry={retry}
        className="aspect-video w-full"
      />
    ) : !src ? (
      <PreviewSkeleton className="aspect-video w-full" />
    ) : (
      <video
        src={src}
        controls
        preload="metadata"
        playsInline
        onError={onError}
        onLoadedMetadata={onLoadedMetadata}
        aria-label={t("attachments.play_video", { name: attachment.fileName })}
        className="aspect-video w-full rounded-lg border border-border bg-sidebar"
      />
    )

  return (
    <figure className="flex w-full max-w-md flex-col gap-2">
      {player}
      <figcaption className="max-w-full">
        <FileRow ticketId={ticketId} attachment={attachment} />
      </figcaption>
    </figure>
  )
}

/**
 * A file deleted by the retention policy (media once the ticket is resolved, every file 7 days
 * after it is closed). Only the metadata is left, so this is static: no link, no download-URL
 * query and no `<img>` / `<video>`, hence no 410 request and no broken preview. The visible
 * text (name, status, when) is what screen readers read; the icon is decorative.
 */
const PurgedTile = ({ attachment }: { attachment: TicketAttachment }) => {
  const { t } = useTranslation("tickets")
  // what the file used to be: crossed-out image, video or document
  const Icon = isImageMime(attachment.mimeType) ? ImageOff : isVideoMime(attachment.mimeType) ? VideoOff : FileX
  return (
    <div className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-3 py-1.5 text-muted-foreground">
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span title={attachment.fileName} className="truncate text-sm">
          {attachment.fileName}
        </span>
        <span className="text-xs">
          {t("attachments.purged")}
          {attachment.purgedAt ? (
            <>
              <span aria-hidden="true"> · </span>
              <RelativeTime iso={attachment.purgedAt} />
            </>
          ) : null}
        </span>
      </span>
    </div>
  )
}

/**
 * Attachments of one message (or of the opening description). Renders nothing when empty.
 * Live files keep their type groups (thumbnails, players, file rows); purged ones follow as
 * one compact group of placeholders, so a removed video never holds a 16:9 box.
 */
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
  const live = attachments.filter((attachment) => !isPurgedAttachment(attachment))
  const purged = attachments.filter(isPurgedAttachment)
  const images = live.filter((attachment) => isImageMime(attachment.mimeType))
  const videos = live.filter((attachment) => isVideoMime(attachment.mimeType))
  const files = live.filter((attachment) => !isImageMime(attachment.mimeType) && !isVideoMime(attachment.mimeType))

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
      {videos.length ? (
        <ul className="flex flex-col gap-3">
          {videos.map((attachment) => (
            <li key={attachment.id} className="flex">
              <VideoAttachment ticketId={ticketId} attachment={attachment} />
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
      {purged.length ? (
        <ul className="flex flex-wrap gap-2">
          {purged.map((attachment) => (
            <li key={attachment.id} className="max-w-full">
              <PurgedTile attachment={attachment} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { TicketAttachments }
