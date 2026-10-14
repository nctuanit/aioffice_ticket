import { useId } from "react"

import { ListFilter, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
} from "@/features/tickets/constants/ticket.constants"
import {
  CLEAR_ALL_FILTERS,
  hasActiveFilters,
  type FilterPatch,
  type TicketListSearch,
} from "@/features/tickets/types/ticket-search"
import { cn } from "@/lib/utils"

type TicketFiltersProps = {
  search: TicketListSearch
  onChange: (patch: FilterPatch) => void
  /** The board shows statuses as columns, so it hides the status filter. */
  showStatus?: boolean
  /** Applied to the trigger button. */
  className?: string
}

type PanelKey = "status" | "assignee" | "participant" | "productModule" | "category" | "priority" | "source"

type PanelField = {
  key: PanelKey
  /** i18n keys (`tickets` namespace) for the field label and its "all" option. */
  label: string
  all: string
  /** `[value, i18n key]` pairs; the empty "all" option is added when rendering. */
  options: readonly (readonly [value: string, labelKey: string])[]
}

/**
 * Selects inside the panel, in display order. Search lives in the topbar and "replied" in the
 * quick filters, so neither is counted on the trigger; both still appear as chips.
 */
const PANEL_FIELDS: readonly PanelField[] = [
  {
    key: "status",
    label: "filters.status",
    all: "filters.all_statuses",
    options: TICKET_STATUSES.map((status) => [status, `status.${status}`] as const),
  },
  {
    key: "assignee",
    label: "filters.assignee",
    all: "filters.all_assignees",
    options: [
      ["me", "filters.assignee_me"],
      ["none", "filters.assignee_none"],
    ],
  },
  {
    key: "participant",
    label: "filters.participant",
    all: "filters.all_participants",
    options: [["me", "filters.participant_me"]],
  },
  {
    key: "productModule",
    label: "filters.module",
    all: "filters.all_modules",
    options: TICKET_PRODUCT_MODULES.map((module) => [module, `module.${module}`] as const),
  },
  {
    key: "category",
    label: "filters.category",
    all: "filters.all_categories",
    options: TICKET_CATEGORIES.map((category) => [category, `category.${category}`] as const),
  },
  {
    key: "priority",
    label: "filters.priority",
    all: "filters.all_priorities",
    options: TICKET_PRIORITIES.map((priority) => [priority, `priority.${priority}`] as const),
  },
  {
    key: "source",
    label: "filters.source",
    all: "filters.all_sources",
    options: TICKET_SOURCES.map((source) => [source, `source.${source}`] as const),
  },
]

/**
 * "Bộ lọc" button that opens the filter panel; every value lives in the URL. The trigger counts
 * the panel filters that are set, while `ActiveFilterChips` shows and removes each one.
 */
const TicketFilters = ({ search, onChange, showStatus = true, className }: TicketFiltersProps) => {
  const { t } = useTranslation("tickets")
  const idPrefix = useId()
  const titleId = `${idPrefix}-title`
  const descriptionId = `${idPrefix}-description`

  const fields = PANEL_FIELDS.filter((field) => showStatus || field.key !== "status")
  const count = fields.filter((field) => search[field.key]).length
  const hasFilters = hasActiveFilters(search, showStatus)

  const select = <K extends keyof FilterPatch>(key: K, value: string) =>
    onChange({ [key]: value || undefined } as FilterPatch)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="dialog"
          className={cn(
            "h-11",
            count > 0 && "border-primary/60 text-primary hover:border-primary hover:text-primary",
            className,
          )}
        >
          <ListFilter aria-hidden="true" />
          {t("filters.button")}
          {count > 0 ? (
            <>
              <span
                aria-hidden="true"
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
              >
                {count}
              </span>
              <span className="sr-only">{t("filters.active_count", { count })}</span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex max-h-[var(--radix-popover-content-available-height)] w-[min(calc(100vw-2rem),40rem)] flex-col gap-4"
      >
        <div className="flex flex-col gap-1 pr-11">
          <h2 id={titleId} className="font-display text-base font-semibold text-foreground">
            {t("filters.panel_title")}
          </h2>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {t("filters.panel_description")}
          </p>
        </div>
        {/* Only the fields scroll on short viewports; the negative margin keeps focus rings unclipped. */}
        <div className="-m-1 grid min-h-0 grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `${idPrefix}-${field.key}`
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                  {t(field.label)}
                </label>
                <NativeSelect
                  id={id}
                  value={search[field.key] ?? ""}
                  onChange={(event) => select(field.key, event.target.value)}
                >
                  <option value="">{t(field.all)}</option>
                  {field.options.map(([value, labelKey]) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )
          })}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" disabled={!hasFilters} onClick={() => onChange(CLEAR_ALL_FILTERS)}>
            <X aria-hidden="true" />
            {t("filters.clear")}
          </Button>
        </div>
        {/* Last in DOM order so the first select, not this button, takes focus when the panel opens. */}
        <PopoverClose
          aria-label={t("filters.close_panel")}
          className="absolute top-2 right-2 grid size-11 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}

export { TicketFilters, type FilterPatch }
