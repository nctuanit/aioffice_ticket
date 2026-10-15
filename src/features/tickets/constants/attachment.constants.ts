/** Mirrors `TICKET_ATTACHMENT_*` in open-office `support-ticket.constant.ts`. */
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
const VIDEO_ATTACHMENT_MAX_BYTES = 100 * 1024 * 1024
const ATTACHMENTS_PER_MESSAGE = 5
const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const
const ATTACHMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "text/plain", ...VIDEO_MIME_TYPES] as const
/** `accept` attribute of the file input (MIME + extensions for pickers that match on extension). */
const ATTACHMENT_ACCEPT = [
  ...ATTACHMENT_MIME_TYPES,
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt",
  ".mp4",
  ".webm",
  ".mov",
].join(",")
/**
 * Mirrors `TicketAttachmentStatus` (the values that reach clients) and `TicketAttachmentPurgeReason`
 * in open-office. A PURGED row stays in the list but its file is gone (download answers 410):
 * media are purged when the ticket is resolved, every file 7 days after it is closed.
 */
const ATTACHMENT_STATUSES = ["ATTACHED", "PURGED"] as const
const ATTACHMENT_PURGE_REASONS = ["RESOLVED_MEDIA", "CLOSED_RETENTION"] as const
/** Presigned download URLs live `expiresIn` seconds (5 min, inline video 30 min); refetch this much before. */
const ATTACHMENT_URL_REFRESH_MARGIN_MS = 60_000

type AttachmentMime = (typeof ATTACHMENT_MIME_TYPES)[number]
type AttachmentStatus = (typeof ATTACHMENT_STATUSES)[number]
type AttachmentPurgeReason = (typeof ATTACHMENT_PURGE_REASONS)[number]

const isAllowedAttachmentMime = (mime: string): mime is AttachmentMime =>
  (ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime)

const isVideoMime = (mime: string) => (VIDEO_MIME_TYPES as readonly string[]).includes(mime)

const isImageMime = (mime: string) => (IMAGE_MIME_TYPES as readonly string[]).includes(mime)

/** The retention policy deleted the file: render a placeholder, never request a download URL. */
const isPurgedAttachment = (attachment: { status: AttachmentStatus }) => attachment.status === "PURGED"

/** Per-file limit by type: images / text 10 MB, video 100 MB. */
const attachmentMaxBytes = (mime: string) => (isVideoMime(mime) ? VIDEO_ATTACHMENT_MAX_BYTES : ATTACHMENT_MAX_BYTES)

export {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  ATTACHMENT_PURGE_REASONS,
  ATTACHMENT_STATUSES,
  ATTACHMENT_URL_REFRESH_MARGIN_MS,
  ATTACHMENTS_PER_MESSAGE,
  attachmentMaxBytes,
  isAllowedAttachmentMime,
  isImageMime,
  isPurgedAttachment,
  isVideoMime,
  VIDEO_ATTACHMENT_MAX_BYTES,
  type AttachmentMime,
  type AttachmentPurgeReason,
  type AttachmentStatus,
}
