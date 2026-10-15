import { useEffect, useRef } from "react"

import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { env } from "@/config/env"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import { getTicket } from "@/features/tickets/api/tickets.api"
import { toNewTicketToastItem } from "@/features/tickets/realtime/new-ticket-toast-item"
import { createNewTicketToasts } from "@/features/tickets/realtime/new-ticket-toasts"
import { runTicketStream, type TicketStreamEvent } from "@/features/tickets/realtime/ticket-stream.client"
import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"
import type { Ticket } from "@/features/tickets/types/ticket.types"
import { api } from "@/lib/axios"
import { refreshAccessToken, tokenManager } from "@/lib/auth"

/** Events arriving together (reply + status change) cause one round of refetches. */
const INVALIDATE_DEBOUNCE_MS = 250
/** The toast waits this long for the staff detail (requester, category, priority), then shows the event alone. */
const DETAIL_TIMEOUT_MS = 2_000

const STREAM_URL = `${env.apiBaseUrl}/admin/tickets/stream`

const invalidateFor = (queryClient: QueryClient, ticketIds: Set<string>, allDetails = false) => {
  const boardPaused = useTicketStreamStore.getState().boardPaused
  void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
  void queryClient.invalidateQueries({
    queryKey: ticketKeys.boards(),
    // mid-drag: mark stale only; the board refetches when the drag ends
    refetchType: boardPaused ? "none" : "active",
  })
  void queryClient.invalidateQueries({ queryKey: ticketKeys.stats() })
  if (allDetails) void queryClient.invalidateQueries({ queryKey: ticketKeys.details() })
  // detail(id) is the prefix of messages(id) / events(id)
  for (const id of ticketIds) void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
}

/**
 * Staff detail of a new ticket through the query cache (so opening it from the toast is instant).
 * Resolves `null` when the request fails, takes longer than `DETAIL_TIMEOUT_MS` or the stream stops;
 * the timer and the abort listener never outlive the call.
 */
const fetchDetailInTime = (queryClient: QueryClient, ticketId: string, signal: AbortSignal) =>
  new Promise<Ticket | null>((resolve) => {
    if (signal.aborted) return resolve(null)
    const finish = (ticket: Ticket | null) => {
      clearTimeout(timer)
      signal.removeEventListener("abort", onAbort)
      resolve(ticket)
    }
    const onAbort = () => finish(null)
    const timer = setTimeout(onAbort, DETAIL_TIMEOUT_MS)
    signal.addEventListener("abort", onAbort)
    queryClient
      .fetchQuery({ queryKey: ticketKeys.detail(ticketId), queryFn: () => getTicket(ticketId), retry: false })
      .then(finish, () => finish(null))
  })

const canNotify = () => typeof Notification !== "undefined" && Notification.permission === "granted"

/**
 * One realtime connection per tab while signed in (mounted once in the Hub shell).
 * Events only invalidate React Query caches — the payload never carries message bodies.
 * Every new ticket (except one the viewer filed themselves) shows a toast once its staff
 * detail is in (≤ 2 s, else from the event alone), grouped when several arrive together, plus
 * a browser notification and the tab-title badge when the tab is hidden. Polling stays as a
 * fallback (slowed while live).
 */
const useTicketStream = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation("tickets")
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setStatus = useTicketStreamStore((state) => state.setStatus)
  const bumpUnseen = useTicketStreamStore((state) => state.bumpUnseen)
  /** Latest render's callbacks, so the connection is not torn down on language change. */
  const handlers = useRef({ t, navigate })

  useEffect(() => {
    handlers.current = { t, navigate }
  }, [t, navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("idle")
      return
    }
    const controller = new AbortController()
    const { signal } = controller
    const pending = new Set<string>()
    let flushTimer: ReturnType<typeof setTimeout> | undefined
    let connectedBefore = false
    let arrivals = 0

    const openTicket = (ticketId: string) => {
      void handlers.current.navigate({ to: "/tickets/$ticketId", params: { ticketId } })
    }
    // plain queue: no filters, default (newest first) order
    const openQueue = () => {
      void handlers.current.navigate({ to: "/tickets", search: {} })
    }
    const toasts = createNewTicketToasts({ openTicket, openQueue })

    const scheduleInvalidate = (ticketId?: string) => {
      if (ticketId) pending.add(ticketId)
      clearTimeout(flushTimer)
      flushTimer = setTimeout(() => {
        invalidateFor(queryClient, new Set(pending))
        pending.clear()
      }, INVALIDATE_DEBOUNCE_MS)
    }

    const notifyHidden = (event: TicketStreamEvent) => {
      if (!canNotify()) return
      let notification: Notification
      try {
        notification = new Notification(
          handlers.current.t("realtime.notification_title", { number: event.ticketNumber }),
          { body: event.subject, tag: `ticket-${event.ticketId}` },
        )
      } catch {
        return // Android Chrome: page notifications need a service worker even when granted
      }
      notification.onclick = () => {
        window.focus()
        openTicket(event.ticketId)
        notification.close()
      }
    }

    const announce = async (event: TicketStreamEvent) => {
      const seq = ++arrivals
      const ticket = await fetchDetailInTime(queryClient, event.ticketId, signal)
      if (signal.aborted) return
      // a ticket the viewer filed (e.g. an admin from the web admin) is not news to them;
      // unknown without the detail, so a late/failed detail still shows the toast
      const viewerId = useAuthStore.getState().user?.id
      if (ticket && viewerId && ticket.requesterId === viewerId) return
      toasts.show(toNewTicketToastItem(event, ticket, seq))
      if (document.visibilityState === "hidden") {
        bumpUnseen()
        notifyHidden(event)
      }
    }

    const onEvent = (event: TicketStreamEvent) => {
      // a frame already read when the stream was stopped (logout / unmount)
      if (signal.aborted) return
      // nothing has the detail of a brand-new ticket cached except the toast's own fetch: keep it fresh
      scheduleInvalidate(event.type === "ticket.created" ? undefined : event.ticketId)
      if (event.type === "ticket.created") {
        void announce(event)
        return
      }
      // tab title badge: count what a customer did while nobody was looking
      if (document.visibilityState === "hidden" && event.actor === "REQUESTER" && event.type === "ticket.message") {
        bumpUnseen()
      }
    }

    void runTicketStream({
      url: STREAM_URL,
      getAccessToken: tokenManager.getAccessToken,
      refreshAccessToken: () => refreshAccessToken(api),
      onEvent,
      onStatus: (status) => {
        if (signal.aborted) return
        // every `live` after the first is a reconnect: events of the gap were missed, refetch once
        if (status === "live") {
          if (connectedBefore) invalidateFor(queryClient, new Set(), true)
          connectedBefore = true
        }
        setStatus(status)
      },
      signal,
    })

    return () => {
      controller.abort()
      clearTimeout(flushTimer)
      toasts.dispose()
      setStatus("idle")
    }
  }, [isAuthenticated, queryClient, setStatus, bumpUnseen])
}

export { useTicketStream }
