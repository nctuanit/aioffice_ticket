import { Globe, MonitorSmartphone } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type {
  TicketPriority,
  TicketProductModule,
  TicketSource,
  TicketStatus,
} from "@/features/tickets/types/ticket.types"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "neutral" | "success" | "warning" | "destructive" | "outline" | "progress"

const STATUS_VARIANT: Record<TicketStatus, BadgeVariant> = {
  OPEN: "default",
  IN_PROGRESS: "progress",
  WAITING_FOR_USER: "warning",
  WAITING_FOR_TEAM: "neutral",
  RESOLVED: "success",
  CLOSED: "outline",
  CANCELLED: "neutral",
  EXPIRED: "destructive",
}

const StatusBadge = ({ status, className }: { status: TicketStatus; className?: string }) => {
  const { t } = useTranslation("tickets")
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {t(`status.${status}`)}
    </Badge>
  )
}

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  URGENT: "text-destructive",
  HIGH: "text-warning",
  NORMAL: "text-muted-foreground",
  LOW: "text-muted-foreground/80",
}

const PRIORITY_BARS: Record<TicketPriority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4 }

/** Signal-style bars + label, so priority never relies on color alone. */
const PriorityIndicator = ({
  priority,
  showLabel = true,
  className,
}: {
  priority: TicketPriority
  showLabel?: boolean
  className?: string
}) => {
  const { t } = useTranslation("tickets")
  const label = t(`priority.${priority}`)
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", PRIORITY_STYLE[priority], className)}
      title={t("fields.priority_value", { value: label })}
    >
      <span aria-hidden="true" className="flex h-3 items-end gap-px">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-[3px] rounded-[1px]",
              bar <= PRIORITY_BARS[priority] ? "bg-current" : "bg-current opacity-20",
            )}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </span>
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  )
}

const ProductModuleBadge = ({ module }: { module?: TicketProductModule | null }) => {
  const { t } = useTranslation("tickets")
  if (!module) return null
  return <Badge variant="neutral">{t(`module.${module}`)}</Badge>
}

const SourceIcon = ({ source }: { source: TicketSource }) => {
  const { t } = useTranslation("tickets")
  const Icon = source === "WEB_ADMIN" ? Globe : MonitorSmartphone
  const label = t(`source.${source}`)
  return (
    <span className="inline-flex items-center text-muted-foreground" title={label}>
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { PriorityIndicator, ProductModuleBadge, SourceIcon, StatusBadge }
