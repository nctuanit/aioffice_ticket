import { useTranslation } from "react-i18next"

import { useTicketStreamStore } from "@/features/tickets/realtime/ticket-stream.store"
import { cn } from "@/lib/utils"

const DOT_CLASS = {
  live: "bg-success",
  connecting: "bg-muted-foreground motion-safe:animate-pulse",
  offline: "bg-warning motion-safe:animate-pulse",
} as const

/**
 * Header dot for the realtime stream: green = live, amber = disconnected (retrying),
 * grey = connecting. Text for assistive tech and as a hover tooltip; status changes
 * are announced politely. Hidden when signed out.
 */
const LiveIndicator = () => {
  const { t } = useTranslation("common")
  const status = useTicketStreamStore((state) => state.status)
  if (status === "idle") return null
  const label = t(`realtime.${status}`)

  return (
    <span title={label} className="inline-flex size-11 shrink-0 items-center justify-center">
      <span aria-hidden="true" className={cn("size-2.5 rounded-full ring-2 ring-card", DOT_CLASS[status])} />
      <span role="status" aria-live="polite" className="sr-only">
        {label}
      </span>
    </span>
  )
}

export { LiveIndicator }
