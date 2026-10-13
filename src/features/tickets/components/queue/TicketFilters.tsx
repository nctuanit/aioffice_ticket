import { useEffect, useState } from "react"

import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRODUCT_MODULES,
  TICKET_SOURCES,
  TICKET_STATUSES,
} from "@/features/tickets/constants/ticket.constants"
import type { TicketListSearch } from "@/features/tickets/types/ticket-search"

type FilterPatch = Partial<Omit<TicketListSearch, "view" | "page">>

type TicketFiltersProps = {
  search: TicketListSearch
  onChange: (patch: FilterPatch) => void
  /** The board shows statuses as columns, so it hides the status filter. */
  showStatus?: boolean
}

const SEARCH_DEBOUNCE_MS = 300

/** Shared filter bar for the list and the board; every value lives in the URL. */
const TicketFilters = ({ search, onChange, showStatus = true }: TicketFiltersProps) => {
  const { t } = useTranslation("tickets")
  const [query, setQuery] = useState(search.q ?? "")
  const [syncedQ, setSyncedQ] = useState(search.q)

  // Keep the box in sync when the URL changes elsewhere (back button, nav links),
  // without clobbering what the user is still typing.
  if (search.q !== syncedQ) {
    setSyncedQ(search.q)
    if ((query.trim() || undefined) !== search.q) setQuery(search.q ?? "")
  }

  useEffect(() => {
    const next = query.trim() || undefined
    if (next === search.q) return
    const timer = window.setTimeout(() => onChange({ q: next }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query, search.q, onChange])

  const hasFilters = Boolean(
    search.q ||
      search.assignee ||
      search.participant ||
      search.category ||
      search.productModule ||
      search.priority ||
      search.source ||
      (showStatus && search.status),
  )

  const select = <K extends keyof FilterPatch>(key: K, value: string) =>
    onChange({ [key]: value || undefined } as FilterPatch)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3" role="search">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="ticket-search" className="sr-only">
          {t("filters.search_label")}
        </label>
        <Input
          id="ticket-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("filters.search_placeholder")}
          className="h-10 pl-9"
          maxLength={200}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {showStatus ? (
          <NativeSelect
            aria-label={t("filters.status")}
            value={search.status ?? ""}
            onChange={(event) => select("status", event.target.value)}
          >
            <option value="">{t("filters.all_statuses")}</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </NativeSelect>
        ) : null}
        <NativeSelect
          aria-label={t("filters.assignee")}
          value={search.assignee ?? ""}
          onChange={(event) => select("assignee", event.target.value)}
        >
          <option value="">{t("filters.all_assignees")}</option>
          <option value="me">{t("filters.assignee_me")}</option>
          <option value="none">{t("filters.assignee_none")}</option>
        </NativeSelect>
        <NativeSelect
          aria-label={t("filters.participant")}
          value={search.participant ?? ""}
          onChange={(event) => select("participant", event.target.value)}
        >
          <option value="">{t("filters.all_participants")}</option>
          <option value="me">{t("filters.participant_me")}</option>
        </NativeSelect>
        <NativeSelect
          aria-label={t("filters.module")}
          value={search.productModule ?? ""}
          onChange={(event) => select("productModule", event.target.value)}
        >
          <option value="">{t("filters.all_modules")}</option>
          {TICKET_PRODUCT_MODULES.map((module) => (
            <option key={module} value={module}>
              {t(`module.${module}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("filters.category")}
          value={search.category ?? ""}
          onChange={(event) => select("category", event.target.value)}
        >
          <option value="">{t("filters.all_categories")}</option>
          {TICKET_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`category.${category}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("filters.priority")}
          value={search.priority ?? ""}
          onChange={(event) => select("priority", event.target.value)}
        >
          <option value="">{t("filters.all_priorities")}</option>
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {t(`priority.${priority}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("filters.source")}
          value={search.source ?? ""}
          onChange={(event) => select("source", event.target.value)}
        >
          <option value="">{t("filters.all_sources")}</option>
          {TICKET_SOURCES.map((source) => (
            <option key={source} value={source}>
              {t(`source.${source}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      {hasFilters ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("")
              onChange({
                q: undefined,
                status: undefined,
                assignee: undefined,
                participant: undefined,
                category: undefined,
                productModule: undefined,
                priority: undefined,
                source: undefined,
              })
            }}
          >
            <X aria-hidden="true" />
            {t("filters.clear")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export { TicketFilters, type FilterPatch }
