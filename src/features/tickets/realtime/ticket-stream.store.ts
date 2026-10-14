import { create } from "zustand"

import type { TicketStreamStatus } from "@/features/tickets/realtime/ticket-stream.client"

type TicketStreamState = {
  /** `idle` = not signed in / stream not started. */
  status: TicketStreamStatus | "idle"
  /** A board card is being dragged: stream events must not refetch the columns under the pointer. */
  boardPaused: boolean
  setStatus: (status: TicketStreamState["status"]) => void
  setBoardPaused: (paused: boolean) => void
}

const useTicketStreamStore = create<TicketStreamState>((set) => ({
  status: "idle",
  boardPaused: false,
  setStatus: (status) => set({ status }),
  setBoardPaused: (boardPaused) => set({ boardPaused }),
}))

export { useTicketStreamStore }
