import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"

/** Polling stays as a fallback; while the realtime stream is live it only needs to catch drift. */
const LIVE_FALLBACK_REFETCH_INTERVAL_MS = 60_000

/** `base` while the stream is down or connecting, 60s while it is live. */
const useLiveRefetchInterval = (base: number) =>
  useTicketStreamStore((state) => (state.status === "live" ? Math.max(base, LIVE_FALLBACK_REFETCH_INTERVAL_MS) : base))

export { LIVE_FALLBACK_REFETCH_INTERVAL_MS, useLiveRefetchInterval }
