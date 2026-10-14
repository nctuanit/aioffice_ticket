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
/** Presigned download URLs live `expiresIn` seconds (5 min, inline video 30 min); refetch this much before. */
const ATTACHMENT_URL_REFRESH_MARGIN_MS = 60_000

type AttachmentMime = (typeof ATTACHMENT_MIME_TYPES)[number]

const isAllowedAttachmentMime = (mime: string): mime is AttachmentMime =>
  (ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime)

const isVideoMime = (mime: string) => (VIDEO_MIME_TYPES as readonly string[]).includes(mime)

const isImageMime = (mime: string) => (IMAGE_MIME_TYPES as readonly string[]).includes(mime)

/** Per-file limit by type: images / text 10 MB, video 100 MB. */
const attachmentMaxBytes = (mime: string) => (isVideoMime(mime) ? VIDEO_ATTACHMENT_MAX_BYTES : ATTACHMENT_MAX_BYTES)

export {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  ATTACHMENT_URL_REFRESH_MARGIN_MS,
  ATTACHMENTS_PER_MESSAGE,
  attachmentMaxBytes,
  isAllowedAttachmentMime,
  isImageMime,
  isVideoMime,
  VIDEO_ATTACHMENT_MAX_BYTES,
  type AttachmentMime,
}
