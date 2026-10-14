import { useCallback, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import {
  confirmAttachment,
  presignAttachment,
  uploadToPresignedUrl,
} from "@/features/tickets/api/tickets.api"
import {
  ATTACHMENTS_PER_MESSAGE,
  attachmentMaxBytes,
  isAllowedAttachmentMime,
  isVideoMime,
} from "@/features/tickets/constants/attachment.constants"
import { apiErrorMessage } from "@/lib/api-error"

type UploadStatus = "uploading" | "confirmed" | "error"

type PendingUpload = {
  localId: string
  file: File
  status: UploadStatus
  /** Set once the backend confirmed the object (size + real MIME). */
  attachmentId?: string
  error?: string
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/**
 * Attachments for one message: pick files → presign → PUT straight to storage →
 * confirm. Rejected files stay in the list with their error until the user removes
 * them (sending is blocked meanwhile); `confirmedIds` is what the message POST sends.
 */
const useAttachmentUpload = () => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const [uploads, setUploads] = useState<PendingUpload[]>([])
  /** Same list as `uploads`, readable synchronously inside callbacks (state updates are deferred). */
  const listRef = useRef<PendingUpload[]>([])

  const commit = useCallback((next: PendingUpload[]) => {
    listRef.current = next
    setUploads(next)
  }, [])

  const update = useCallback(
    (localId: string, patch: Partial<PendingUpload>) => {
      commit(listRef.current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)))
    },
    [commit],
  )

  const run = useCallback(
    async (upload: PendingUpload) => {
      try {
        const presign = await presignAttachment({
          fileName: upload.file.name,
          mimeType: upload.file.type,
          sizeBytes: upload.file.size,
        })
        await uploadToPresignedUrl(presign.uploadUrl, upload.file, presign.contentType)
        const confirmed = await confirmAttachment(presign.attachmentId)
        update(upload.localId, { status: "confirmed", attachmentId: confirmed.id })
      } catch (error) {
        update(upload.localId, { status: "error", error: apiErrorMessage(error, tAll) })
      }
    },
    [tAll, update],
  )

  /** Validates locally (type, size, count, duplicates) before touching the network. */
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const current = listRef.current
      const live = current.filter((item) => item.status !== "error")
      const room = Math.max(0, ATTACHMENTS_PER_MESSAGE - live.length)
      const picked = Array.from(files)
      const fresh = picked.filter((file) => !live.some((item) => sameFile(item.file, file)))
      const next: PendingUpload[] = fresh.slice(0, room).map((file) => {
        const localId = crypto.randomUUID()
        if (!isAllowedAttachmentMime(file.type)) {
          return { localId, file, status: "error", error: t("attachments.wrong_type") }
        }
        if (file.size > attachmentMaxBytes(file.type)) {
          const error = t(isVideoMime(file.type) ? "attachments.video_too_large" : "attachments.too_large")
          return { localId, file, status: "error", error }
        }
        if (file.size === 0) {
          return { localId, file, status: "error", error: t("attachments.empty_file") }
        }
        return { localId, file, status: "uploading" }
      })
      commit([...current, ...next])
      for (const upload of next) {
        if (upload.status === "uploading") void run(upload)
      }
      return { overflow: fresh.length > room, duplicates: picked.length - fresh.length }
    },
    [commit, run, t],
  )

  const remove = useCallback(
    (localId: string) => commit(listRef.current.filter((item) => item.localId !== localId)),
    [commit],
  )

  const reset = useCallback(() => commit([]), [commit])

  const confirmedIds = uploads.flatMap((item) => (item.attachmentId ? [item.attachmentId] : []))
  const uploading = uploads.some((item) => item.status === "uploading")
  const failed = uploads.some((item) => item.status === "error")

  return { uploads, addFiles, remove, reset, confirmedIds, uploading, failed }
}

export { useAttachmentUpload, type PendingUpload }
