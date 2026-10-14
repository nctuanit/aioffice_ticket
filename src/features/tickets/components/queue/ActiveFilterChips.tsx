import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  CLEAR_ALL_FILTERS,
  hasActiveFilters,
  type FilterPatch,
  type TicketListSearch,
} from "@/features/tickets/types/ticket-search"
import { moduleTone, type ModuleTone } from "@/features/tickets/utils/module-tone"
import { cn } from "@/lib/utils"

type ActiveFilterChipsProps = {
  search: TicketListSearch
  onChange: (patch: FilterPatch) => void
  /** The board shows statuses as columns, so it never shows a status chip. */
  showStatus?: boolean
  className?: string
}

type Chip = {
  key: keyof FilterPatch
  text: string
  /** App identity colour (the "Ứng dụng" chip matches the product-module badge). */
  tone?: ModuleTone
}

/**
 * One removable chip per active URL filter (search, panel selects, "replied") plus "clear all".
 * Sits under the quick-filter row so the applied filters stay visible while the panel is closed.
 */
const ActiveFilterChips = ({ search, onChange, showStatus = true, className }: ActiveFilterChipsProps) => {
  const { t } = useTranslation("tickets")

  if (!hasActiveFilters(search, showStatus)) return null

  const labelled = (labelKey: string, valueKey: string) =>
    t("filters.chip", { label: t(labelKey), value: t(valueKey) })

  const chips: Chip[] = []
  if (search.q) chips.push({ key: "q", text: t("filters.chip_search", { q: search.q }) })
  if (showStatus && search.status) {
    chips.push({ key: "status", text: labelled("filters.status", `status.${search.status}`) })
  }
  if (search.assignee) {
    const valueKey = search.assignee === "me" ? "filters.assignee_me" : "filters.assignee_none"
    chips.push({ key: "assignee", text: labelled("filters.assignee", valueKey) })
  }
  if (search.participant) {
    chips.push({ key: "participant", text: labelled("filters.participant", "filters.participant_me") })
  }
  if (search.productModule) {
    chips.push({
      key: "productModule",
      text: labelled("filters.module", `module.${search.productModule}`),
      tone: moduleTone(search.productModule),
    })
  }
  if (search.category) {
    chips.push({ key: "category", text: labelled("filters.category", `category.${search.category}`) })
  }
  if (search.priority) {
    chips.push({ key: "priority", text: labelled("filters.priority", `priority.${search.priority}`) })
  }
  if (search.source) chips.push({ key: "source", text: labelled("filters.source", `source.${search.source}`) })
  if (search.replied) chips.push({ key: "replied", text: t("quick_filters.replied") })

  return (
    <ul aria-label={t("filters.active_label")} className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <li
          key={chip.key}
          className={cn(
            "inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border pl-3 pr-0.5 text-sm",
            chip.tone ? chip.tone.badge : "border-primary/40 bg-primary/5 text-foreground",
          )}
        >
          {chip.tone ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", chip.tone.dot)} /> : null}
          <span className="min-w-0 truncate">{chip.text}</span>
          <button
            type="button"
            aria-label={t("filters.remove", { label: chip.text })}
            onClick={() => onChange({ [chip.key]: undefined } as FilterPatch)}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </li>
      ))}
      <li>
        <Button variant="ghost" size="sm" className="h-11" onClick={() => onChange(CLEAR_ALL_FILTERS)}>
          <X aria-hidden="true" />
          {t("filters.clear")}
        </Button>
      </li>
    </ul>
  )
}

export { ActiveFilterChips }
