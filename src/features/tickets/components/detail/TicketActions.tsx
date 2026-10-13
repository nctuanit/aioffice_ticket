import { useState, type ReactNode } from "react"

import { useQueryClient } from "@tanstack/react-query"
import { Hand, UserMinus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { MoveTicketDialog, type PendingMove } from "@/features/tickets/components/board/MoveTicketDialog"
import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import { replyToCustomer } from "@/features/tickets/api/tickets.api"
import {
  CONFIRM_STATUSES,
  FINAL_STATUSES,
  STAFF_TRANSITIONS,
  TICKET_PRIORITIES,
  type TicketStatusCode,
} from "@/features/tickets/constants/ticket.constants"
import { useAssignees } from "@/features/tickets/hooks/useTicketQueries"
import {
  useChangeTicketAssignee,
  useChangeTicketPriority,
  useChangeTicketStatus,
  useClaimTicket,
} from "@/features/tickets/hooks/useTicketMutations"
import type { Ticket, TicketPriority } from "@/features/tickets/types/ticket.types"
import { apiErrorMessage } from "@/lib/api-error"

const Field = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
)

/**
 * Handling controls. Only valid next statuses are offered (staff transition table).
 * Admins can assign anyone; support staff can claim an unassigned ticket or release
 * their own (the backend enforces the same rule).
 */
const TicketActions = ({ ticket }: { ticket: Ticket }) => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === "admin"
  const assignees = useAssignees()
  const claim = useClaimTicket()
  const changeStatus = useChangeTicketStatus()
  const changeAssignee = useChangeTicketAssignee()
  const changePriority = useChangeTicketPriority()
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [confirming, setConfirming] = useState(false)

  const locked = FINAL_STATUSES.includes(ticket.status)
  const nextStatuses = STAFF_TRANSITIONS[ticket.status]
  const mine = ticket.assigneeId === user?.id
  const prefix = `ticket-${ticket.id}`

  const onStatus = (to: TicketStatusCode) => {
    if (CONFIRM_STATUSES.includes(to)) {
      setPending({ ticket, to })
      return
    }
    changeStatus.mutate({ ticketId: ticket.id, status: to })
  }

  const confirmMove = async (move: PendingMove, message: string) => {
    setConfirming(true)
    try {
      if (message.trim()) {
        await replyToCustomer({ ticketId: move.ticket.id, body: message.trim(), clientRequestId: crypto.randomUUID() })
        await queryClient.invalidateQueries({ queryKey: ticketKeys.messages(move.ticket.id) })
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, tAll))
      setConfirming(false)
      return
    }
    try {
      await changeStatus.mutateAsync({ ticketId: move.ticket.id, status: move.to })
      setPending(null)
    } catch {
      // the mutation hook already shows the error toast
    } finally {
      setConfirming(false)
    }
  }

  return (
    <section aria-label={t("detail.actions")} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      {!locked && !ticket.assigneeId ? (
        <Button onClick={() => claim.mutate(ticket.id)} disabled={claim.isPending}>
          <Hand aria-hidden="true" />
          {t("detail.claim")}
        </Button>
      ) : null}

      <Field id={`${prefix}-status`} label={t("fields.status")}>
        <NativeSelect
          id={`${prefix}-status`}
          value={ticket.status}
          disabled={locked || nextStatuses.length === 0 || changeStatus.isPending}
          onChange={(event) => onStatus(event.target.value as TicketStatusCode)}
        >
          <option value={ticket.status}>{t(`status.${ticket.status}`)}</option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {t("detail.move_to_status", { status: t(`status.${status}`) })}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id={`${prefix}-priority`} label={t("fields.priority")}>
        <NativeSelect
          id={`${prefix}-priority`}
          value={ticket.priority}
          disabled={locked || changePriority.isPending}
          onChange={(event) =>
            changePriority.mutate({ ticketId: ticket.id, priority: event.target.value as TicketPriority })
          }
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {t(`priority.${priority}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id={`${prefix}-assignee`} label={t("fields.assignee")}>
        {isAdmin ? (
          <NativeSelect
            id={`${prefix}-assignee`}
            value={ticket.assigneeId ?? ""}
            disabled={locked || changeAssignee.isPending || assignees.isPending}
            onChange={(event) =>
              changeAssignee.mutate({ ticketId: ticket.id, assigneeId: event.target.value || null })
            }
          >
            <option value="">{t("queue.unassigned")}</option>
            {(assignees.data ?? []).map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.fullName || assignee.email}
                {assignee.id === user?.id ? ` (${t("detail.you")})` : ""}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <div className="flex min-h-10 items-center justify-between gap-2 text-sm">
            <span id={`${prefix}-assignee`}>
              {ticket.assignee ? ticket.assignee.fullName || ticket.assignee.email : t("queue.unassigned")}
            </span>
            {mine && !locked ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={changeAssignee.isPending}
                onClick={() => changeAssignee.mutate({ ticketId: ticket.id, assigneeId: null })}
              >
                <UserMinus aria-hidden="true" />
                {t("detail.release")}
              </Button>
            ) : null}
          </div>
        )}
      </Field>

      <MoveTicketDialog
        key={pending ? `${pending.ticket.id}-${pending.to}` : "none"}
        pending={pending}
        submitting={confirming}
        onCancel={() => setPending(null)}
        onConfirm={(move, message) => void confirmMove(move, message)}
      />
    </section>
  )
}

export { TicketActions }
