import { Link } from "@tanstack/react-router"
import { ExternalLink, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { TicketActions } from "@/features/tickets/components/detail/TicketActions"
import { TicketComposer } from "@/features/tickets/components/detail/TicketComposer"
import { TicketConversation } from "@/features/tickets/components/detail/TicketConversation"
import { TicketHistory } from "@/features/tickets/components/detail/TicketHistory"
import { TicketInfo } from "@/features/tickets/components/detail/TicketInfo"
import {
  PriorityIndicator,
  ProductModuleBadge,
  StatusBadge,
} from "@/features/tickets/components/TicketBadges"
import { ExpiryCountdown } from "@/features/tickets/components/TicketMeta"
import { useTicketDetail } from "@/features/tickets/hooks/useTicketQueries"
import { apiErrorMessage, apiErrorStatus } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/shared/components/EmptyState"
import { ErrorState } from "@/shared/components/ErrorState"

type TicketDetailViewProps = {
  ticketId: string
  /** `page`: two columns on wide screens. `sheet`: single column inside the side panel. */
  variant?: "page" | "sheet"
}

const TicketDetailView = ({ ticketId, variant = "page" }: TicketDetailViewProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const detail = useTicketDetail(ticketId)

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (detail.isError) {
    if (apiErrorStatus(detail.error) === 404) {
      return <EmptyState icon={SearchX} title={t("detail.not_found")} description={t("detail.not_found_body")} />
    }
    return (
      <ErrorState
        message={apiErrorMessage(detail.error, tAll)}
        onRetry={() => void detail.refetch()}
        retrying={detail.isFetching}
      />
    )
  }

  const ticket = detail.data
  const sheet = variant === "sheet"

  return (
    <div className="flex flex-col gap-5">
      <header className={cn("flex flex-col gap-2", sheet && "pr-10")}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{ticket.ticketNumber}</span>
          <StatusBadge status={ticket.status} />
          <PriorityIndicator priority={ticket.priority} />
          <ProductModuleBadge module={ticket.productModule} />
          <ExpiryCountdown ticket={ticket} />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight break-words text-foreground sm:text-2xl">
          {ticket.subject}
        </h1>
        {sheet ? (
          <Link
            to="/tickets/$ticketId"
            params={{ ticketId: ticket.id }}
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink aria-hidden="true" className="size-3.5" />
            {t("detail.open_full")}
          </Link>
        ) : null}
      </header>

      <div className={cn("grid gap-5", !sheet && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <div className={cn("flex min-w-0 flex-col gap-5", sheet && "order-2")}>
          <TicketConversation ticket={ticket} />
          <TicketComposer ticket={ticket} />
        </div>
        <aside className={cn("flex flex-col gap-4", sheet && "order-1")}>
          <TicketActions ticket={ticket} />
          <TicketInfo ticket={ticket} />
          <TicketHistory ticketId={ticket.id} />
        </aside>
      </div>
    </div>
  )
}

export { TicketDetailView }
