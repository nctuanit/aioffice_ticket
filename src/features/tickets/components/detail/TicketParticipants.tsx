import { useId, useRef, useState, type KeyboardEvent } from "react"

import { RefreshCw, UserPlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { UserAvatar } from "@/features/tickets/components/TicketMeta"
import { FINAL_STATUSES } from "@/features/tickets/constants/ticket.constants"
import { useAssignees } from "@/features/tickets/hooks/useTicketQueries"
import { useAddParticipant, useRemoveParticipant } from "@/features/tickets/hooks/useTicketMutations"
import type { Ticket, TicketParticipant, UserSummary } from "@/features/tickets/types/ticket.types"
import { userLabel } from "@/features/tickets/utils/format"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"

const MAX_SUGGESTIONS = 6

/**
 * People tagged on the ticket (watchers / collaborators / reviewers) and a searchable
 * picker over the active admin + support users. Works as a combobox: type to filter,
 * arrow keys to move, Enter to tag; `@name` in an internal note tags people too.
 * Hidden on CANCELLED / EXPIRED tickets (the backend rejects changes there as well).
 */
const TicketParticipants = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const assignees = useAssignees()
  const add = useAddParticipant(ticket.id)
  const remove = useRemoveParticipant(ticket.id)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const inputId = useId()
  const headingId = useId()

  const locked = FINAL_STATUSES.includes(ticket.status)
  const participants = ticket.participants ?? []
  const tagged = new Set(participants.map((participant) => participant.userId))
  const needle = query.trim().toLowerCase()
  const options = (assignees.data ?? [])
    .filter((user) => !tagged.has(user.id))
    .filter((user) => !needle || user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle))
    .slice(0, MAX_SUGGESTIONS)
  const activeIndex = options.length ? Math.min(active, options.length - 1) : 0
  const expanded = open && !locked

  const pick = (user: UserSummary) => {
    add.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          setQuery("")
          setActive(0)
        },
      },
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, Math.max(0, options.length - 1)))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      if (expanded && options[activeIndex] && !add.isPending) {
        event.preventDefault()
        pick(options[activeIndex])
      }
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const onRemove = (participant: TicketParticipant) => {
    if (!participant.userId) return
    remove.mutate({ userId: participant.userId, name: userLabel(participant.user) })
  }

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-labelledby={headingId}>
      <p id={headingId} className="text-xs font-medium text-muted-foreground">
        {t("participants.title")}
      </p>

      {participants.length ? (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border" aria-label={t("participants.title")}>
          {participants.map((participant) => {
            const name = userLabel(participant.user)
            const isMe = participant.userId === currentUser?.id
            return (
              <li key={participant.id} className="flex min-h-11 items-center gap-2 py-0.5 pl-2.5 text-sm">
                {participant.user ? <UserAvatar user={participant.user} size="xs" className="bg-muted text-muted-foreground" /> : null}
                <span className="min-w-0 flex-1 truncate">
                  {name}
                  {isMe ? <span className="text-muted-foreground"> ({t("detail.you")})</span> : null}
                </span>
                <span className="text-xs text-muted-foreground">{t(`participants.role.${participant.role}`)}</span>
                {!locked ? (
                  <button
                    type="button"
                    onClick={() => onRemove(participant)}
                    disabled={remove.isPending}
                    aria-label={t("participants.remove", { name })}
                    className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                ) : (
                  <span className="w-2.5" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t("participants.empty")}</p>
      )}

      {!locked ? (
        <div>
          <label htmlFor={inputId} className="sr-only">
            {t("participants.add_label")}
          </label>
          <div className="relative" aria-busy={add.isPending || undefined}>
            <UserPlus aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id={inputId}
              role="combobox"
              aria-expanded={expanded}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={expanded && options[activeIndex] ? `${listId}-${options[activeIndex].id}` : undefined}
              autoComplete="off"
              value={query}
              placeholder={t("participants.add_placeholder")}
              disabled={assignees.isPending}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
              className="pl-9"
            />
            {expanded ? (
              <ul
                id={listId}
                role="listbox"
                aria-label={t("participants.add_label")}
                // keep focus in the input while clicking an option
                onMouseDown={(event) => event.preventDefault()}
                className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-md"
              >
                {assignees.isError ? (
                  <li role="presentation" className="flex items-center justify-between gap-2 px-2.5 py-2 text-sm text-destructive">
                    <span role="alert">{apiErrorMessage(assignees.error, tAll)}</span>
                    <Button variant="ghost" size="sm" onClick={() => void assignees.refetch()} disabled={assignees.isFetching}>
                      <RefreshCw aria-hidden="true" className={cn(assignees.isFetching && "animate-spin")} />
                      {tAll("common:retry")}
                    </Button>
                  </li>
                ) : options.length === 0 ? (
                  <li role="presentation" className="px-2.5 py-2 text-sm text-muted-foreground">
                    {t("participants.no_match")}
                  </li>
                ) : (
                  options.map((user, index) => (
                    <li
                      key={user.id}
                      id={`${listId}-${user.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => !add.isPending && pick(user)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150",
                        index === activeIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      <UserAvatar user={user} size="xs" />
                      <span className="min-w-0 flex-1 truncate">{userLabel(user)}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("participants.hint")}</p>
        </div>
      ) : null}
    </div>
  )
}

export { TicketParticipants }
