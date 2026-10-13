import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ticketKeys } from "@/features/tickets/api/ticket.keys"
import {
  addHoliday,
  getSupportCalendar,
  listHolidays,
  removeHoliday,
  updateSupportCalendar,
} from "@/features/tickets/api/tickets.api"
import { apiErrorMessage } from "@/lib/api-error"

const useSupportCalendar = () =>
  useQuery({ queryKey: ticketKeys.calendar(), queryFn: getSupportCalendar })

const useHolidays = () => useQuery({ queryKey: ticketKeys.holidays(), queryFn: listHolidays })

/**
 * Calendar edits recompute the deadline of every unhandled OPEN ticket on the server,
 * so the queue, board and stats are refetched afterwards.
 */
const useCalendarMutations = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ticketKeys.calendar() }),
      queryClient.invalidateQueries({ queryKey: ticketKeys.holidays() }),
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
    ])
  const onError = (error: unknown) => toast.error(apiErrorMessage(error, tAll))

  const saveWeekdays = useMutation({
    mutationFn: updateSupportCalendar,
    onSuccess: async () => {
      toast.success(t("calendar.saved"))
      await refresh()
    },
    onError,
  })
  const createHoliday = useMutation({
    mutationFn: addHoliday,
    onSuccess: async () => {
      toast.success(t("calendar.holiday_added"))
      await refresh()
    },
    onError,
  })
  const deleteHoliday = useMutation({
    mutationFn: removeHoliday,
    onSuccess: async () => {
      toast.success(t("calendar.holiday_removed"))
      await refresh()
    },
    onError,
  })

  return { saveWeekdays, createHoliday, deleteHoliday }
}

export { useCalendarMutations, useHolidays, useSupportCalendar }
