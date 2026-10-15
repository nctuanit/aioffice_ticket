import { useCallback, useEffect, useMemo } from "react"

import { useNavigate, useSearch } from "@tanstack/react-router"
import { FileSearch, Inbox, MessageCircleReply, RotateCw, SearchX, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TicketBoard } from "@/features/tickets/components/board/TicketBoard"
import { ActiveFilterChips } from "@/features/tickets/components/queue/ActiveFilterChips"
import { QuickFilters } from "@/features/tickets/components/queue/QuickFilters"
import { TicketFilters } from "@/features/tickets/components/queue/TicketFilters"
import { TicketTable } from "@/features/tickets/components/queue/TicketTable"
import { ViewSwitcher, type TicketView } from "@/features/tickets/components/queue/ViewSwitcher"
import { QUEUE_PAGE_SIZE } from "@/features/tickets/constants/ticket.constants"
import { useTicketList } from "@/features/tickets/hooks/useTicketQueries"
import { readStoredView, storeView } from "@/features/tickets/hooks/useTicketView"
import { useQueueNavStore } from "@/features/tickets/stores/queue-nav.store"
import {
  CLEAR_ALL_FILTERS,
  hasActiveFilters,
  pickBoardFilters,
  type FilterPatch,
  type TicketListSearch,
} from "@/features/tickets/types/ticket-search"
import { customerReplied } from "@/features/tickets/utils/ticket-signals"
import { resolveTicketSort, ticketSortPatch, toApiSort } from "@/features/tickets/utils/ticket-sort"
import { apiErrorMessage } from "@/lib/api-error"
import { EmptyState } from "@/shared/components/EmptyState"
import { ErrorState } from "@/shared/components/ErrorState"
import { PageHeader } from "@/shared/components/PageHeader"
import { Pagination } from "@/shared/components/Pagination"

type TicketListViewProps = {
  search: TicketListSearch
  onPage: (page: number) => void
  onFilters: (patch: FilterPatch) => void
}

const TicketListView = ({ search, onPage, onFilters }: TicketListViewProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const page = search.page ?? 1
  const sort = resolveTicketSort(search)
  const list = useTicketList({
    ...pickBoardFilters(search),
    status: search.status,
    page,
    limit: QUEUE_PAGE_SIZE,
    ...toApiSort(sort),
  })
  const setQueueIds = useQueueNavStore((state) => state.setIds)

  const pageTickets = list.data?.data
  // "Customer replied" narrows the loaded page only (the API has no such filter).
  const tickets = useMemo(
    () => (search.replied ? (pageTickets ?? []).filter(customerReplied) : (pageTickets ?? [])),
    [pageTickets, search.replied],
  )

  // Next / previous in the detail follow exactly what this page shows.
  useEffect(() => {
    if (pageTickets) setQueueIds(tickets.map((ticket) => ticket.id))
  }, [pageTickets, tickets, setQueueIds])

  if (list.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }
  if (list.isError) {
    return <ErrorState message={apiErrorMessage(list.error, tAll)} onRetry={() => void list.refetch()} retrying={list.isFetching} />
  }

  const { meta } = list.data
  const totalPages = meta.totalPages ?? Math.ceil(meta.total / meta.limit)
  const pagination = (
    <div className="mt-4">
      <Pagination page={meta.page} totalPages={totalPages} total={meta.total} onPageChange={onPage} />
    </div>
  )

  if (list.data.data.length === 0) {
    // e.g. the last page emptied while it was open, or a stale ?page= link
    if (page > 1 && meta.total > 0) {
      return (
        <EmptyState
          icon={FileSearch}
          title={t("queue.page_empty_title")}
          description={t("queue.page_empty_body")}
          action={
            <Button variant="outline" onClick={() => onPage(1)}>
              {t("queue.first_page")}
            </Button>
          }
        />
      )
    }
    return hasActiveFilters(search) ? (
      <EmptyState
        icon={SearchX}
        title={t("queue.no_match_title")}
        description={t("queue.no_match_body")}
        action={
          <Button variant="outline" onClick={() => onFilters(CLEAR_ALL_FILTERS)}>
            <X aria-hidden="true" />
            {t("filters.clear")}
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Inbox}
        title={t("queue.empty_title")}
        description={t("queue.empty_body")}
        action={
          <Button variant="outline" onClick={() => void list.refetch()} disabled={list.isFetching}>
            <RotateCw aria-hidden="true" className={list.isFetching ? "motion-safe:animate-spin" : undefined} />
            {t("queue.reload")}
          </Button>
        }
      />
    )
  }

  if (tickets.length === 0) {
    // the page has tickets, none of them with a fresh customer reply
    return (
      <>
        <EmptyState
          icon={MessageCircleReply}
          title={t("queue.replied_empty_title")}
          description={t("queue.replied_empty_body")}
          action={
            <Button variant="outline" onClick={() => onFilters({ replied: undefined })}>
              <X aria-hidden="true" />
              {t("queue.remove_replied")}
            </Button>
          }
        />
        {pagination}
      </>
    )
  }

  return (
    <div className={list.isPlaceholderData ? "opacity-70 transition-opacity" : undefined}>
      <TicketTable
        tickets={tickets}
        sort={sort}
        onSort={(next) => onFilters(ticketSortPatch(next, search))}
      />
      {pagination}
    </div>
  )
}

/** Page title follows the "preset" filters reachable from the sidebar. */
const queueTitleKey = (search: TicketListSearch) => {
  if (search.participant === "me") return "queue.title_watching"
  if (search.assignee === "me") return "queue.title_mine"
  if (search.status === "CLOSED") return "queue.title_closed"
  return "queue.title"
}

/**
 * Ticket queue: list (paged table) or Kanban board. Both share the URL-driven quick filters, the
 * "Bộ lọc" popover and the active-filter chips; the search box lives in the shell topbar.
 */
const QueuePage = () => {
  const { t } = useTranslation("tickets")
  const search = useSearch({ from: "/hub/tickets" })
  const navigate = useNavigate({ from: "/tickets" })
  const view: TicketView = search.view ?? readStoredView() ?? "list"

  useEffect(() => {
    storeView(view)
  }, [view])

  const onFilters = useCallback(
    (patch: FilterPatch) => void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace: true }),
    [navigate],
  )

  const title = t(queueTitleKey(search))

  return (
    <>
      <PageHeader
        title={title}
        description={view === "board" ? t("board.subtitle") : t("queue.subtitle")}
        actions={<ViewSwitcher value={view} onChange={(next) => void navigate({ search: (prev) => ({ ...prev, view: next, page: undefined }) })} />}
      />
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <QuickFilters search={search} onChange={onFilters} view={view} />
          <TicketFilters search={search} onChange={onFilters} showStatus={view === "list"} className="ml-auto shrink-0" />
        </div>
        <ActiveFilterChips search={search} onChange={onFilters} showStatus={view === "list"} />
      </div>
      {view === "board" ? (
        <TicketBoard
          filters={pickBoardFilters(search)}
          repliedOnly={search.replied === true}
          filtered={hasActiveFilters(search, false)}
          onClearFilters={() => onFilters(CLEAR_ALL_FILTERS)}
        />
      ) : (
        <TicketListView
          search={search}
          onFilters={onFilters}
          onPage={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
        />
      )}
    </>
  )
}

export { QueuePage }
