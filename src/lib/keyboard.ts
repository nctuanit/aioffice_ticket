/** Single-key shortcuts must never fire while the user is typing. */
const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

const OVERLAY_SELECTOR = [
  '[role="dialog"]:not([data-state="closed"])',
  '[role="alertdialog"]:not([data-state="closed"])',
  '[role="menu"]:not([data-state="closed"])',
].join(", ")

/**
 * True when a dialog / menu is open that does not contain `scope` (e.g. a confirm dialog
 * on top of the detail sheet). Without a scope, any open overlay counts.
 */
const hasOverlayOutside = (scope?: Element | null) =>
  Array.from(document.querySelectorAll(OVERLAY_SELECTOR)).some((overlay) => !scope || !overlay.contains(scope))

/** Plain key press: no Ctrl / Cmd / Alt (Shift is allowed for `?`). */
const isPlainKey = (event: KeyboardEvent) => !event.ctrlKey && !event.metaKey && !event.altKey

export { hasOverlayOutside, isPlainKey, isTypingTarget }
