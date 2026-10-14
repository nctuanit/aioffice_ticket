import { create } from "zustand"

import type { TicketStreamStatus } from "@/features/tickets/realtime/ticket-stream.client"

type TicketStreamState = {
  /** `idle` = not signed in / stream not started. */
  status: TicketStreamStatus | "idle"
  /** A board card is being dragged: stream events must not refetch the columns under the pointer. */
  boardPaused: boolean
  /** New tickets / customer messages received while the tab was hidden (tab title badge). */
  unseen: number
  setStatus: (status: TicketStreamState["status"]) => void
  setBoardPaused: (paused: boolean) => void
  bumpUnseen: () => void
  resetUnseen: () => void
}

const useTicketStreamStore = create<TicketStreamState>((set) => ({
  status: "idle",
  boardPaused: false,
  unseen: 0,
  setStatus: (status) => set({ status }),
  setBoardPaused: (boardPaused) => set({ boardPaused }),
  bumpUnseen: () => set((state) => ({ unseen: state.unseen + 1 })),
  resetUnseen: () => set((state) => (state.unseen ? { unseen: 0 } : state)),
}))

export { useTicketStreamStore }
