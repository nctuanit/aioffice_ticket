import { Hourglass } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  TICKET_EXPIRY_CRITICAL_WORKING_HOURS,
  TICKET_EXPIRY_WARNING_WORKING_HOURS,
} from "@/features/tickets/constants/ticket.constants"
import type { Ticket, UserSummary } from "@/features/tickets/types/ticket.types"
import { formatDateTime, relativeTime } from "@/features/tickets/utils/format"
import { cn } from "@/lib/utils"

const HOUR_MS = 60 * 60 * 1000

type ExpiryTone = "neutral" | "warning" | "critical"

const expiryTone = (remainingMs: number): ExpiryTone => {
  if (remainingMs <= TICKET_EXPIRY_CRITICAL_WORKING_HOURS * HOUR_MS) return "critical"
  if (remainingMs <= TICKET_EXPIRY_WARNING_WORKING_HOURS * HOUR_MS) return "warning"
  return "neutral"
}

const TONE_CLASS: Record<ExpiryTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
}

/**
 * Working time left before an unhandled ticket expires (server-computed
 * `remainingWorkingMs`, refreshed by polling). Renders nothing once someone handled it.
 */
const ExpiryCountdown = ({ ticket, className }: { ticket: Ticket; className?: string }) => {
  const { t } = useTranslation("tickets")
  const remaining = ticket.remainingWorkingMs
  if (ticket.status !== "OPEN" || ticket.firstHandledAt || remaining == null) return null

  const tone = expiryTone(remaining)
  const hours = Math.floor(remaining / HOUR_MS)
  const minutes = Math.max(1, Math.round((remaining % HOUR_MS) / 60_000))
  const label =
    remaining <= 0
      ? t("expiry.overdue")
      : hours >= 1
        ? t("expiry.hours_left", { count: hours })
        : t("expiry.minutes_left", { count: minutes })

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums",
        TONE_CLASS[tone],
        className,
      )}
      title={t("expiry.tooltip")}
    >
      <Hourglass aria-hidden="true" className="size-3" />
      {label}
    </span>
  )
}

const initials = (user: Pick<UserSummary, "fullName" | "email">) => {
  const source = (user.fullName || user.email).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

const UserAvatar = ({
  user,
  size = "sm",
  className,
}: {
  user: Pick<UserSummary, "fullName" | "email">
  size?: "xs" | "sm" | "md"
  className?: string
}) => (
  <span
    title={user.fullName || user.email}
    aria-hidden="true"
    className={cn(
      "grid shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary ring-2 ring-card",
      size === "xs" && "size-6 text-xs",
      size === "sm" && "size-7 text-xs",
      size === "md" && "size-9 text-xs",
      className,
    )}
  >
    {initials(user)}
  </span>
)

/** "3 giờ trước" with the exact timestamp in a tooltip and `<time>` for assistive tech. */
const RelativeTime = ({ iso, className }: { iso: string; className?: string }) => {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "vi"
  return (
    <time dateTime={iso} title={formatDateTime(iso, locale)} className={cn("whitespace-nowrap", className)}>
      {relativeTime(iso, locale)}
    </time>
  )
}

export { ExpiryCountdown, RelativeTime, UserAvatar }
