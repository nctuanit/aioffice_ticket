import { useTranslation } from "react-i18next"

import { UserAvatar } from "@/features/tickets/components/TicketMeta"
import type { TicketParticipant } from "@/features/tickets/types/ticket.types"
import { userLabel } from "@/features/tickets/utils/format"
import { cn } from "@/lib/utils"

type ParticipantAvatarsProps = {
  participants: TicketParticipant[] | undefined
  /** Avatars shown before the "+N" bubble. */
  max?: number
  size?: "xs" | "sm"
  className?: string
}

/**
 * Overlapping avatars of the people tagged on a ticket (watchers / collaborators),
 * distinct from the single assignee. Renders nothing when nobody is tagged; the full
 * list of names is exposed to assistive tech and as a tooltip.
 */
const ParticipantAvatars = ({ participants, max = 3, size = "xs", className }: ParticipantAvatarsProps) => {
  const { t } = useTranslation("tickets")
  const people = (participants ?? []).filter((participant) => participant.user)
  if (people.length === 0) return null

  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  const names = people.map((participant) => userLabel(participant.user)).join(", ")

  return (
    <span
      className={cn("inline-flex items-center", size === "xs" ? "-space-x-1.5" : "-space-x-2", className)}
      role="img"
      aria-label={t("participants.list_label", { count: people.length, names })}
      title={names}
    >
      {shown.map((participant) => (
        <UserAvatar
          key={participant.id}
          user={participant.user as { fullName: string; email: string }}
          size={size}
          className="bg-muted text-muted-foreground ring-card"
        />
      ))}
      {rest > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card tabular-nums",
            size === "xs" ? "size-6 text-xs" : "size-7 text-xs",
          )}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  )
}

export { ParticipantAvatars }
