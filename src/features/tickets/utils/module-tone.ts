import type { TicketProductModule } from "@/features/tickets/types/ticket.types"

/**
 * Tailwind classes built from the `--app-*` tokens in `globals.css`.
 * Plain data (no React) so badges, filter chips and dashboard bars share one source of truth.
 */
type ModuleTone = {
  /** Outline badge: tinted background, soft border, readable ink. */
  badge: string
  /** Solid identity dot shown before the app name. */
  dot: string
  /** Solid identity bar (dashboard breakdown). */
  bar: string
}

/** Neutral slate, used for the admin web and for anything the Hub does not know. */
const NEUTRAL_TONE: ModuleTone = {
  badge: "border-app-admin/30 bg-app-admin/12 text-app-admin-ink",
  dot: "bg-app-admin",
  bar: "bg-app-admin",
}

const MODULE_TONE: Record<TicketProductModule, ModuleTone> = {
  WRITER: {
    badge: "border-app-writer/30 bg-app-writer/12 text-app-writer-ink",
    dot: "bg-app-writer",
    bar: "bg-app-writer",
  },
  SENS: {
    badge: "border-app-sens/30 bg-app-sens/12 text-app-sens-ink",
    dot: "bg-app-sens",
    bar: "bg-app-sens",
  },
  MEET: {
    badge: "border-app-meet/30 bg-app-meet/12 text-app-meet-ink",
    dot: "bg-app-meet",
    bar: "bg-app-meet",
  },
  NOTE: {
    badge: "border-app-note/30 bg-app-note/12 text-app-note-ink",
    dot: "bg-app-note",
    bar: "bg-app-note",
  },
  ART: {
    badge: "border-app-art/30 bg-app-art/12 text-app-art-ink",
    dot: "bg-app-art",
    bar: "bg-app-art",
  },
  MAIL: {
    badge: "border-app-mail/30 bg-app-mail/12 text-app-mail-ink",
    dot: "bg-app-mail",
    bar: "bg-app-mail",
  },
  SLIDE: {
    badge: "border-app-slide/30 bg-app-slide/12 text-app-slide-ink",
    dot: "bg-app-slide",
    bar: "bg-app-slide",
  },
  SHEET: {
    badge: "border-app-sheet/30 bg-app-sheet/12 text-app-sheet-ink",
    dot: "bg-app-sheet",
    bar: "bg-app-sheet",
  },
  WEB_ADMIN: NEUTRAL_TONE,
}

const isKnownModule = (module: string): module is TicketProductModule => Object.hasOwn(MODULE_TONE, module)

/** Tone for a module; a missing or unknown value falls back to the neutral slate set. */
const moduleTone = (module?: string | null): ModuleTone =>
  module && isKnownModule(module) ? MODULE_TONE[module] : NEUTRAL_TONE

export { MODULE_TONE, moduleTone, NEUTRAL_TONE, type ModuleTone }
