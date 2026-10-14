import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"

import { useNavigate, useSearch } from "@tanstack/react-router"
import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 300
/** Shared with `useGlobalShortcuts` (`/` focuses the box, opening it first on mobile). */
const SEARCH_INPUT_ID = "ticket-search"
const SEARCH_TOGGLE_ID = "ticket-search-open"
const SEARCH_FIELD_ID = "ticket-search-field"

/**
 * Ticket search in the shell header, on every page.
 *
 * - On the queue it drives `?q=` (debounced, every other filter kept, page reset) and mirrors the URL
 *   when `q` changes elsewhere (back button, sidebar links, chip removal). Enter applies at once.
 * - Anywhere else typing is local; Enter opens the queue with the text as `q`.
 * - Below `sm` the field collapses into an icon button and opens over the header row.
 */
const TopbarSearch = () => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  // `undefined` while the queue route is not matched, so `onQueue` and `urlQ` always agree
  // (a pathname check would flip a frame before the match carries the new search).
  const search = useSearch({ from: "/hub/tickets", shouldThrow: false })
  const onQueue = search !== undefined
  const urlQ = search?.q

  const inputRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(urlQ ?? "")
  const [synced, setSynced] = useState({ onQueue, q: urlQ })

  // Keep the box in sync with the URL (and empty it when leaving the queue) without
  // clobbering what the user is still typing. Leaving the queue also folds the mobile field away.
  if (synced.onQueue !== onQueue || synced.q !== urlQ) {
    setSynced({ onQueue, q: urlQ })
    if ((query.trim() || undefined) !== urlQ) setQuery(urlQ ?? "")
    if (synced.onQueue && !onQueue) setOpen(false)
  }

  /** Queue only: set `q`, keep every other filter, back to page 1. */
  const applyQ = useCallback(
    (next: string | undefined) =>
      void navigate({ to: "/tickets", search: (prev) => ({ ...prev, q: next, page: undefined }), replace: true }),
    [navigate],
  )

  useEffect(() => {
    if (!onQueue) return
    const next = query.trim() || undefined
    if (next === urlQ) return
    const timer = window.setTimeout(() => applyQ(next), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query, urlQ, onQueue, applyQ])

  // Mobile: focus the field as soon as it opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const closeField = () => {
    setOpen(false)
    // hidden (display: none) on `sm` and up, so this only moves focus on mobile
    toggleRef.current?.focus()
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = query.trim() || undefined
    if (onQueue) applyQ(next)
    else void navigate({ to: "/tickets", search: { q: next } })
    // mobile: the query is applied, give the header row back (no-op on desktop)
    closeField()
  }

  const onClear = () => {
    setQuery("")
    if (onQueue) applyQ(undefined)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    // keep the text (Chromium clears a search field on Esc); just leave the box
    event.preventDefault()
    event.currentTarget.blur()
    closeField()
  }

  const label = t("filters.search_label")

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <Button
        ref={toggleRef}
        type="button"
        variant="ghost"
        size="icon"
        id={SEARCH_TOGGLE_ID}
        className="size-11 sm:hidden"
        aria-label={tCommon("search_open")}
        title={tCommon("search_open")}
        aria-expanded={open}
        aria-controls={SEARCH_FIELD_ID}
        onClick={() => setOpen(true)}
      >
        <Search aria-hidden="true" />
      </Button>

      <div
        id={SEARCH_FIELD_ID}
        className={cn(
          "min-w-0 flex-1 items-center gap-2",
          open
            ? "absolute inset-0 z-10 flex bg-card px-3 motion-safe:animate-[hub-fade-in_150ms_ease-out] sm:static sm:z-auto sm:bg-transparent sm:px-0"
            : "hidden sm:flex",
        )}
      >
        <form role="search" className="relative flex w-full max-w-2xl items-center" onSubmit={onSubmit}>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
            {label}
          </label>
          <Input
            ref={inputRef}
            id={SEARCH_INPUT_ID}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("filters.search_placeholder")}
            title={t("shortcuts.with_key", { label, key: "/" })}
            aria-keyshortcuts="/"
            autoComplete="off"
            maxLength={200}
            className="h-11 pr-11 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 size-11 text-muted-foreground hover:bg-transparent hover:text-foreground"
              aria-label={tCommon("search_clear")}
              title={tCommon("search_clear")}
              onClick={onClear}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </form>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 sm:hidden"
          aria-label={tCommon("search_close")}
          title={tCommon("search_close")}
          onClick={closeField}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export { TopbarSearch }
