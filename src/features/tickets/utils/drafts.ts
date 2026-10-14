import type { SendMode } from "@/features/tickets/hooks/useTicketMutations"

/**
 * Composer drafts, one per ticket and mode, kept in this browser only. Storage can be
 * unavailable (private mode, quota), so every access is guarded and failures are silent.
 */
const draftKey = (ticketId: string, mode: SendMode) => `ticket-hub.draft.${ticketId}.${mode}`

const readDraft = (ticketId: string, mode: SendMode): string => {
  try {
    return window.localStorage.getItem(draftKey(ticketId, mode)) ?? ""
  } catch {
    return ""
  }
}

/** Saves the text, or removes the draft when it is blank. Returns false when storage failed. */
const writeDraft = (ticketId: string, mode: SendMode, text: string): boolean => {
  try {
    if (text.trim()) window.localStorage.setItem(draftKey(ticketId, mode), text)
    else window.localStorage.removeItem(draftKey(ticketId, mode))
    return true
  } catch {
    return false
  }
}

const clearDraft = (ticketId: string, mode: SendMode) => {
  writeDraft(ticketId, mode, "")
}

export { clearDraft, readDraft, writeDraft }
