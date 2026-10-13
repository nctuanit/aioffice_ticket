/** Mirrors `TICKET_ATTACHMENT_*` in open-office `support-ticket.constant.ts`. */
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
const ATTACHMENTS_PER_MESSAGE = 5
const ATTACHMENT_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "text/plain"] as const
/** `accept` attribute of the file input (MIME + extensions for pickers that match on extension). */
const ATTACHMENT_ACCEPT = [...ATTACHMENT_MIME_TYPES, ".png", ".jpg", ".jpeg", ".webp", ".txt"].join(
  ",",
)
/** Presigned download URLs live 5 minutes; refetch a little before that. */
const ATTACHMENT_URL_STALE_MS = 4 * 60_000

type AttachmentMime = (typeof ATTACHMENT_MIME_TYPES)[number]

const isAllowedAttachmentMime = (mime: string): mime is AttachmentMime =>
  (ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime)

export {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  ATTACHMENT_URL_STALE_MS,
  ATTACHMENTS_PER_MESSAGE,
  isAllowedAttachmentMime,
  type AttachmentMime,
}
