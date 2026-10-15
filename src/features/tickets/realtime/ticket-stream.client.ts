import { z } from "zod"

/**
 * `GET /admin/tickets/stream` (SSE) of open-office. Read with `fetch` streaming, not
 * `EventSource`, because the endpoint needs the `Authorization` header.
 */
const ticketStreamEventSchema = z.object({
  type: z.enum(["ticket.created", "ticket.updated", "ticket.message", "ticket.expired"]),
  ticketId: z.string(),
  ticketNumber: z.string(),
  subject: z.string(),
  status: z.string(),
  productModule: z.string().nullable(),
  source: z.string(),
  actor: z.enum(["REQUESTER", "STAFF", "SYSTEM"]),
  at: z.string(),
})

type TicketStreamEvent = z.infer<typeof ticketStreamEventSchema>

type TicketStreamStatus = "connecting" | "live" | "offline"

type TicketStreamOptions = {
  url: string
  getAccessToken: () => string | null
  /** Shared refresh flow; rejects when the session is gone (the caller is logged out). */
  refreshAccessToken: () => Promise<string>
  onEvent: (event: TicketStreamEvent) => void
  onStatus: (status: TicketStreamStatus) => void
  signal: AbortSignal
}

/** Backend heartbeat is 25s; no byte for this long means a dead connection. */
const STALL_TIMEOUT_MS = 60_000
const BACKOFF_BASE_MS = 1_000
const BACKOFF_MAX_MS = 30_000
/** Feature flag off (404) or no access (403): retry rarely instead of hammering. */
const UNAVAILABLE_RETRY_MS = 5 * 60_000

class HttpStatusError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`stream responded ${status}`)
    this.status = status
  }
}

/** Resolves after `ms` or on abort; the abort listener is removed either way (the signal lives for the session). */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    signal.addEventListener("abort", onAbort, { once: true })
  })

/** Exponential backoff with jitter: ~1s, 2s, 4s … capped at 30s. */
const backoffDelay = (attempt: number) => {
  const ceiling = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt)
  return ceiling / 2 + Math.random() * (ceiling / 2)
}

/** Splits an SSE byte stream into `{ event, data }` frames; comments (heartbeats) are skipped. */
const createSseParser = (onFrame: (event: string, data: string) => void) => {
  let buffer = ""
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n?/g, "\n")
    let boundary = buffer.indexOf("\n\n")
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      let event = "message"
      const data: string[] = []
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart())
      }
      if (data.length || event !== "message") onFrame(event, data.join("\n"))
      boundary = buffer.indexOf("\n\n")
    }
  }
}

/** One connection attempt; resolves when the server ends the stream, rejects on errors. */
const readStream = async (options: TicketStreamOptions, token: string, signal: AbortSignal) => {
  const attempt = new AbortController()
  const abort = () => attempt.abort()
  signal.addEventListener("abort", abort)
  let stallTimer: ReturnType<typeof setTimeout> | undefined
  const armStallTimer = () => {
    clearTimeout(stallTimer)
    stallTimer = setTimeout(abort, STALL_TIMEOUT_MS)
  }
  try {
    armStallTimer()
    const response = await fetch(options.url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
      signal: attempt.signal,
    })
    if (!response.ok || !response.body) throw new HttpStatusError(response.status)
    const parse = createSseParser((event, data) => {
      if (event === "ready") {
        options.onStatus("live")
        return
      }
      try {
        const parsed = ticketStreamEventSchema.safeParse(JSON.parse(data))
        if (parsed.success) options.onEvent(parsed.data)
      } catch {
        // malformed frame: ignore, the next poll catches up
      }
    })
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      armStallTimer()
      parse(value)
    }
  } finally {
    clearTimeout(stallTimer)
    signal.removeEventListener("abort", abort)
  }
}

/**
 * Keeps one stream open until `signal` aborts (logout / unmount): reconnects with
 * backoff after network errors, runs the shared refresh flow once on a 401 and
 * reconnects with the new token; stops for good when the refresh fails.
 */
const runTicketStream = async (options: TicketStreamOptions) => {
  const { signal } = options
  let failures = 0
  let refreshedForThisFailure = false
  while (!signal.aborted) {
    const token = options.getAccessToken()
    if (!token) {
      options.onStatus("offline")
      await sleep(backoffDelay(failures++), signal)
      continue
    }
    options.onStatus(failures ? "offline" : "connecting")
    let delay: number
    try {
      await readStream(options, token, signal)
      // server closed the stream cleanly (deploy / restart): reconnect quickly
      failures = 0
      refreshedForThisFailure = false
      delay = BACKOFF_BASE_MS
    } catch (error) {
      if (signal.aborted) break
      if (error instanceof HttpStatusError && error.status === 401 && !refreshedForThisFailure) {
        refreshedForThisFailure = true
        try {
          await options.refreshAccessToken()
          continue
        } catch {
          options.onStatus("offline")
          return // session expired; the auth layer logs the user out
        }
      }
      const unavailable = error instanceof HttpStatusError && (error.status === 403 || error.status === 404)
      delay = unavailable ? UNAVAILABLE_RETRY_MS : backoffDelay(failures)
      failures++
      if (!(error instanceof HttpStatusError && error.status === 401)) refreshedForThisFailure = false
    }
    if (signal.aborted) break
    options.onStatus("offline")
    await sleep(delay, signal)
  }
}

export { createSseParser, runTicketStream, ticketStreamEventSchema, type TicketStreamEvent, type TicketStreamStatus }
