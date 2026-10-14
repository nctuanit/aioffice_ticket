import { create } from "zustand"

type ComposerDirtyState = {
  /** Ticket ids whose open composer holds unsent text or attachments. */
  dirty: Record<string, true>
  setDirty: (ticketId: string, dirty: boolean) => void
}

/** Lets the detail sheet ask "leave with unsent text?" without reaching into the composer. */
const useComposerDirtyStore = create<ComposerDirtyState>((set) => ({
  dirty: {},
  setDirty: (ticketId, dirty) =>
    set((state) => {
      if (Boolean(state.dirty[ticketId]) === dirty) return state
      const next = { ...state.dirty }
      if (dirty) next[ticketId] = true
      else delete next[ticketId]
      return { dirty: next }
    }),
}))

export { useComposerDirtyStore }
