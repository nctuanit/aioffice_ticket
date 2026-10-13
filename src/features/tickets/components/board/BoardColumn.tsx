import type { ReactNode } from "react"

import { useDroppable } from "@dnd-kit/core"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { BOARD_CLOSED_WINDOW_DAYS } from "@/features/tickets/constants/ticket.constants"
import { STATUS_DOT } from "@/features/tickets/constants/ticket-ui.constants"
import type { BoardColumnData } from "@/features/tickets/hooks/useBoard"
import { ErrorState } from "@/shared/components/ErrorState"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"

type BoardColumnProps = {
  column: BoardColumnData
  /** A card is being dragged and this column is not a valid target for it. */
  disabled: boolean
  /** A card is being dragged and this column accepts it. */
  accepting: boolean
  children: ReactNode
}

const BoardColumn = ({ column, disabled, accepting, children }: BoardColumnProps) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled })
  const headingId = `board-col-${column.status}`

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        "flex max-h-full w-[18.5rem] shrink-0 snap-start flex-col rounded-2xl border border-transparent bg-muted/70 transition-[opacity,border-color,background-color] duration-150",
        accepting && "border-dashed border-border-strong",
        accepting && isOver && "border-primary bg-primary/5",
        disabled && "opacity-45",
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span aria-hidden="true" className={cn("size-2 rounded-full", STATUS_DOT[column.status])} />
        <h2 id={headingId} className="text-sm font-semibold text-foreground">
          {t(`status.${column.status}`)}
        </h2>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {column.isLoading ? "…" : column.total}
        </span>
      </header>
      {column.status === "CLOSED" ? (
        <p className="px-3 pb-2 text-xs text-muted-foreground">
          {t("board.closed_window", { count: BOARD_CLOSED_WINDOW_DAYS })}{" "}
          <Link to="/tickets" search={{ view: "list", status: "CLOSED" }} className="font-medium text-primary hover:underline">
            {t("board.see_all")}
          </Link>
        </p>
      ) : null}
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
        {column.isLoading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : column.isError ? (
          <ErrorState className="py-6" message={apiErrorMessage(column.error, tAll)} onRetry={column.refetch} />
        ) : column.tickets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong/70 px-3 py-6 text-center text-xs text-muted-foreground">
            {accepting ? t("board.drop_here") : t("board.empty_column")}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

export { BoardColumn }
