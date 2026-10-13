import { useCallback, useEffect } from "react"

import { useNavigate, useSearch } from "@tanstack/react-router"
import { Inbox, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { TicketBoard } from "@/features/tickets/components/board/TicketBoard"
import { TicketFilters, type FilterPatch } from "@/features/tickets/components/queue/TicketFilters"
import { TicketTable } from "@/features/tickets/components/queue/TicketTable"
import { ViewSwitcher, type TicketView } from "@/features/tickets/components/queue/ViewSwitcher"
import { QUEUE_PAGE_SIZE } from "@/features/tickets/constants/ticket.constants"
import { useTicketList } from "@/features/tickets/hooks/useTicketQueries"
import { readStoredView, storeView } from "@/features/tickets/hooks/useTicketView"
import { pickBoardFilters, type TicketListSearch } from "@/features/tickets/types/ticket-search"
import { apiErrorMessage } from "@/lib/api-error"
import { EmptyState } from "@/shared/components/EmptyState"
import { ErrorState } from "@/shared/components/ErrorState"
import { PageHeader } from "@/shared/components/PageHeader"
import { Pagination } from "@/shared/components/Pagination"

const TicketListView = ({ search, onPage }: { search: TicketListSearch; onPage: (page: number) => void }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const page = search.page ?? 1
  const list = useTicketList({ ...pickBoardFilters(search), status: search.status, page, limit: QUEUE_PAGE_SIZE })

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

  const filtered = Object.entries(search).some(([key, value]) => key !== "view" && key !== "page" && value)
  if (list.data.data.length === 0) {
    return filtered ? (
      <EmptyState icon={SearchX} title={t("queue.no_match_title")} description={t("queue.no_match_body")} />
    ) : (
      <EmptyState icon={Inbox} title={t("queue.empty_title")} description={t("queue.empty_body")} />
    )
  }

  const { meta } = list.data
  return (
    <div className={list.isPlaceholderData ? "opacity-70 transition-opacity" : undefined}>
      <TicketTable tickets={list.data.data} />
      <div className="mt-4">
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages ?? Math.ceil(meta.total / meta.limit)}
          total={meta.total}
          onPageChange={onPage}
        />
      </div>
    </div>
  )
}

/** Ticket queue: list (paged table) or Kanban board, sharing one URL-driven filter bar. */
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

  const title =
    search.assignee === "me" ? t("queue.title_mine") : search.status === "CLOSED" ? t("queue.title_closed") : t("queue.title")

  return (
    <>
      <PageHeader
        title={title}
        description={view === "board" ? t("board.subtitle") : t("queue.subtitle")}
        actions={<ViewSwitcher value={view} onChange={(next) => void navigate({ search: (prev) => ({ ...prev, view: next, page: undefined }) })} />}
      />
      <TicketFilters search={search} onChange={onFilters} showStatus={view === "list"} />
      {view === "board" ? (
        <TicketBoard filters={pickBoardFilters(search)} />
      ) : (
        <TicketListView search={search} onPage={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })} />
      )}
    </>
  )
}

export { QueuePage }
