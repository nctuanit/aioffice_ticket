import { useRef } from "react"

import { MessageSquareText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Ticket } from "@/features/tickets/types/ticket.types"

/** Snippet ids; the label and the text live in i18n (`canned.items.<id>`), so they follow the UI language. */
const CANNED_REPLIES = [
  "greeting",
  "ask_version",
  "ask_screenshot",
  "investigating",
  "fixed_update",
  "closing",
] as const

type CannedRepliesMenuProps = {
  ticket: Ticket
  disabled?: boolean
  onInsert: (text: string) => void
  /** Where focus goes after inserting (the textarea), instead of back to the trigger. */
  onAfterInsert: () => void
}

/**
 * "Quick replies" menu: inserts a predefined snippet at the cursor. Placeholders
 * `{{customerName}}` and `{{ticketNumber}}` are filled by i18next interpolation.
 */
const CannedRepliesMenu = ({ ticket, disabled, onInsert, onAfterInsert }: CannedRepliesMenuProps) => {
  const { t } = useTranslation("tickets")
  const inserted = useRef(false)
  const values = {
    customerName: ticket.requester?.fullName?.trim() || t("canned.customer_fallback"),
    ticketNumber: ticket.ticketNumber,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={disabled}>
          <MessageSquareText aria-hidden="true" />
          {t("canned.menu")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))]"
        onCloseAutoFocus={(event) => {
          if (!inserted.current) return
          inserted.current = false
          event.preventDefault()
          onAfterInsert()
        }}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("canned.hint")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CANNED_REPLIES.map((id) => {
          const text = t(`canned.items.${id}.body`, values)
          return (
            <DropdownMenuItem
              key={id}
              className="min-h-11 cursor-pointer flex-col items-start gap-0.5"
              onSelect={() => {
                inserted.current = true
                onInsert(text)
              }}
            >
              <span className="font-medium">{t(`canned.items.${id}.label`)}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{text}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { CannedRepliesMenu }
