import { useEffect, useRef } from "react"

import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { env } from "@/config/env"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import { runTicketStream, type TicketStreamEvent } from "@/features/tickets/realtime/ticket-stream.client"
import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"
import { api } from "@/lib/axios"
import { refreshAccessToken, tokenManager } from "@/lib/auth"

/** Events arriving together (reply + status change) cause one round of refetches. */
const INVALIDATE_DEBOUNCE_MS = 250

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

const canNotify = () => typeof Notification !== "undefined" && Notification.permission === "granted"

/**
 * One realtime connection per tab while signed in (mounted once in the Hub shell).
 * Events only invalidate React Query caches — the payload never carries message bodies;
 * a new customer ticket also shows a toast, plus a browser notification when the tab
 * is hidden and the user opted in. Polling stays as a fallback (slowed while live).
 */
const useTicketStream = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation("tickets")
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setStatus = useTicketStreamStore((state) => state.setStatus)
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
    const pending = new Set<string>()
    let flushTimer: ReturnType<typeof setTimeout> | undefined
    let wasOffline = false

    const openTicket = (ticketId: string) => {
      void handlers.current.navigate({ to: "/tickets/$ticketId", params: { ticketId } })
    }

    const announce = (event: TicketStreamEvent) => {
      const { t: translate } = handlers.current
      toast(translate("realtime.new_ticket", { number: event.ticketNumber, subject: event.subject }), {
        id: `ticket-created-${event.ticketId}`,
        action: { label: translate("realtime.open"), onClick: () => openTicket(event.ticketId) },
      })
      if (document.visibilityState === "hidden" && canNotify()) {
        const notification = new Notification(translate("realtime.notification_title", { number: event.ticketNumber }), {
          body: event.subject,
          tag: `ticket-${event.ticketId}`,
        })
        notification.onclick = () => {
          window.focus()
          openTicket(event.ticketId)
          notification.close()
        }
      }
    }

    const onEvent = (event: TicketStreamEvent) => {
      pending.add(event.ticketId)
      clearTimeout(flushTimer)
      flushTimer = setTimeout(() => {
        invalidateFor(queryClient, new Set(pending))
        pending.clear()
      }, INVALIDATE_DEBOUNCE_MS)
      if (event.type === "ticket.created" && event.actor === "REQUESTER") announce(event)
    }

    void runTicketStream({
      url: STREAM_URL,
      getAccessToken: tokenManager.getAccessToken,
      refreshAccessToken: () => refreshAccessToken(api),
      onEvent,
      onStatus: (status) => {
        if (controller.signal.aborted) return
        // back after a gap: events may have been missed, refetch what is on screen once
        if (status === "live" && wasOffline) invalidateFor(queryClient, new Set(), true)
        wasOffline = status === "offline"
        setStatus(status)
      },
      signal: controller.signal,
    })

    return () => {
      controller.abort()
      clearTimeout(flushTimer)
      setStatus("idle")
    }
  }, [isAuthenticated, queryClient, setStatus])
}

export { useTicketStream }
