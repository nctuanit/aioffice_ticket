import { useRef } from "react"

import { Link, useNavigate } from "@tanstack/react-router"
import { ExternalLink, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TicketActions } from "@/features/tickets/components/detail/TicketActions"
import { TicketComposer, type ComposerHandle } from "@/features/tickets/components/detail/TicketComposer"
import { TicketConversation } from "@/features/tickets/components/detail/TicketConversation"
import { TicketHistory } from "@/features/tickets/components/detail/TicketHistory"
import { TicketInfo } from "@/features/tickets/components/detail/TicketInfo"
import { TicketToolbar } from "@/features/tickets/components/detail/TicketToolbar"
import {
  PriorityIndicator,
  ProductModuleBadge,
  StatusBadge,
} from "@/features/tickets/components/TicketBadges"
import { ExpiryCountdown } from "@/features/tickets/components/TicketMeta"
import { useTicketDetailShortcuts } from "@/features/tickets/hooks/useTicketDetailShortcuts"
import { useTicketDetail } from "@/features/tickets/hooks/useTicketQueries"
import { useQueueNeighbours } from "@/features/tickets/stores/queue-nav.store"
import { apiErrorMessage, apiErrorStatus } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/shared/components/EmptyState"
import { ErrorState } from "@/shared/components/ErrorState"

type TicketDetailViewProps = {
  ticketId: string
  /** `page`: two columns on wide screens. `sheet`: single column inside the side panel. */
  variant?: "page" | "sheet"
  /** Next / previous ticket. Defaults to navigating to the ticket's page. */
  onOpenTicket?: (ticketId: string) => void
}

const DetailSkeleton = ({ sheet }: { sheet: boolean }) => (
  <div className="flex flex-col gap-5" aria-busy="true">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-11 w-56" />
    </div>
    <div className={cn("grid gap-5", !sheet && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
)

const TicketDetailView = ({ ticketId, variant = "page", onOpenTicket }: TicketDetailViewProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const navigate = useNavigate()
  const detail = useTicketDetail(ticketId)
  const neighbours = useQueueNeighbours(ticketId)
  const root = useRef<HTMLDivElement>(null)
  const composer = useRef<ComposerHandle>(null)
  const sheet = variant === "sheet"

  const openTicket =
    onOpenTicket ?? ((id: string) => void navigate({ to: "/tickets/$ticketId", params: { ticketId: id } }))

  useTicketDetailShortcuts({ root, ticket: detail.data, composer, neighbours, onOpenTicket: openTicket })

  if (detail.isPending) return <DetailSkeleton sheet={sheet} />

  if (detail.isError) {
    if (apiErrorStatus(detail.error) === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title={t("detail.not_found")}
          description={t("detail.not_found_body")}
          action={
            sheet ? null : (
              <Button asChild variant="outline">
                <Link to="/tickets">{t("detail.back_to_queue")}</Link>
              </Button>
            )
          }
        />
      )
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

  return (
    <div ref={root} className="flex flex-col gap-5">
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
        <div className="-ml-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <TicketToolbar ticket={ticket} neighbours={neighbours} onOpenTicket={openTicket} />
          {sheet ? (
            <Link
              to="/tickets/$ticketId"
              params={{ ticketId: ticket.id }}
              className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              {t("detail.open_full")}
            </Link>
          ) : null}
        </div>
      </header>

      <div className={cn("grid gap-5", !sheet && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <div className={cn("flex min-w-0 flex-col gap-5", sheet && "order-2")}>
          <TicketConversation key={ticket.id} ticket={ticket} />
          <TicketComposer ticket={ticket} ref={composer} />
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
