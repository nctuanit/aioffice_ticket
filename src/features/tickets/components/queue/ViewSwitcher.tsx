import { KanbanSquare, List } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

type TicketView = "list" | "board"

const OPTIONS: Array<{ value: TicketView; icon: typeof List }> = [
  { value: "list", icon: List },
  { value: "board", icon: KanbanSquare },
]

/** Segmented "List | Kanban" toggle (radio group semantics). */
const ViewSwitcher = ({ value, onChange }: { value: TicketView; onChange: (view: TicketView) => void }) => {
  const { t } = useTranslation("tickets")

  return (
    <div role="radiogroup" aria-label={t("view.label")} className="inline-flex rounded-lg border border-border bg-card p-1">
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <option.icon aria-hidden="true" className="size-4" />
            {t(`view.${option.value}`)}
          </button>
        )
      })}
    </div>
  )
}

export { ViewSwitcher, type TicketView }
