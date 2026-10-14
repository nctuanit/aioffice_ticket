import { useEffect, useRef } from "react"

import { useNavigate, useRouter } from "@tanstack/react-router"

import { hasOverlayOutside, isPlainKey, isTypingTarget } from "@/lib/keyboard"

/** Second key of a `g …` sequence must follow within this window. */
const SEQUENCE_TIMEOUT_MS = 1_500
const SEARCH_INPUT_ID = "ticket-search"
/** Mobile-only button that expands the collapsed topbar search (see `TopbarSearch`). */
const SEARCH_TOGGLE_ID = "ticket-search-open"
const FOCUS_RETRY_FRAMES = 30

/**
 * Focuses the topbar search box. Below `sm` the box is collapsed behind a toggle: when the
 * input is missing or cannot take focus, press the toggle once and keep trying for a few frames
 * while the field renders.
 */
const focusSearch = (attempt = 0, opened = false) => {
  const input = document.getElementById(SEARCH_INPUT_ID)
  if (input instanceof HTMLInputElement) {
    input.focus()
    if (document.activeElement === input) {
      input.select()
      return
    }
  }
  const toggle = opened ? null : document.getElementById(SEARCH_TOGGLE_ID)
  toggle?.click()
  if (attempt < FOCUS_RETRY_FRAMES) requestAnimationFrame(() => focusSearch(attempt + 1, opened || toggle !== null))
}

/**
 * App-wide shortcuts (ignored while typing or while a dialog / menu is open):
 * `/` focuses the topbar search on any page, `g d` dashboard, `g q` queue list, `g b` board,
 * `?` shortcut help.
 */
const useGlobalShortcuts = ({ onHelp }: { onHelp: () => void }) => {
  const navigate = useNavigate()
  const router = useRouter()
  const pendingG = useRef(0)
  const onHelpRef = useRef(onHelp)

  useEffect(() => {
    onHelpRef.current = onHelp
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || !isPlainKey(event) || isTypingTarget(event.target)) return

      if (event.key === "?") {
        event.preventDefault()
        onHelpRef.current()
        return
      }
      if (hasOverlayOutside()) return

      const onQueue = router.state.location.pathname === "/tickets"
      if (pendingG.current && Date.now() - pendingG.current < SEQUENCE_TIMEOUT_MS) {
        pendingG.current = 0
        const target = { d: "dashboard", q: "list", b: "board" }[event.key.toLowerCase()]
        if (!target) return
        event.preventDefault()
        if (target === "dashboard") void navigate({ to: "/dashboard" })
        else {
          const view = target as "list" | "board"
          // on the queue already: keep the filters, switch the view
          void navigate({ to: "/tickets", search: onQueue ? (prev) => ({ ...prev, view, page: undefined }) : { view } })
        }
        return
      }

      if (event.key === "g" && !event.shiftKey) {
        pendingG.current = Date.now()
        return
      }
      if (event.key === "/") {
        event.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate, router])
}

export { useGlobalShortcuts }
