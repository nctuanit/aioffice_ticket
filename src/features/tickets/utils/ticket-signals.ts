import type { Ticket } from "@/features/tickets/types/ticket.types"

/** The opening message also sets `lastMessageBy = REQUESTER`; only a later message counts as a reply. */
const OPENING_MESSAGE_SLACK_MS = 5_000

/** The customer wrote last, after staff had started handling the ticket. */
const customerReplied = (ticket: Ticket) =>
  ticket.lastMessageBy === "REQUESTER" &&
  Boolean(ticket.firstHandledAt) &&
  Boolean(ticket.lastMessageAt) &&
  new Date(ticket.lastMessageAt as string).getTime() - new Date(ticket.createdAt).getTime() > OPENING_MESSAGE_SLACK_MS

export { customerReplied }
