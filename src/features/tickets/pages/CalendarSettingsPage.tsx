import { useState, type FormEvent } from "react"

import { CalendarOff, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useCalendarMutations, useHolidays, useSupportCalendar } from "@/features/tickets/hooks/useSupportCalendar"
import { apiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/shared/components/ErrorState"
import { PageHeader } from "@/shared/components/PageHeader"

/** Monday first, as staff read a week; values are JS weekdays (0 = Sunday). */
const WEEK = [1, 2, 3, 4, 5, 6, 0] as const

const WeekdaysEditor = ({ initial }: { initial: number[] }) => {
  const { t } = useTranslation("tickets")
  const { saveWeekdays } = useCalendarMutations()
  const [days, setDays] = useState<number[]>(initial)
  const dirty = [...days].sort().join() !== [...initial].sort().join()

  const toggle = (day: number) =>
    setDays((current) => (current.includes(day) ? current.filter((value) => value !== day) : [...current, day]))

  return (
    <section aria-labelledby="weekdays-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 id="weekdays-heading" className="text-sm font-semibold text-foreground">
          {t("calendar.weekdays_title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("calendar.weekdays_body")}</p>
      </div>
      <div role="group" aria-labelledby="weekdays-heading" className="flex flex-wrap gap-2">
        {WEEK.map((day) => {
          const on = days.includes(day)
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(day)}
              className={cn(
                "h-11 min-w-14 cursor-pointer rounded-lg border px-3 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {t(`calendar.weekday.${day}`)}
            </button>
          )
        })}
      </div>
      {days.length === 0 ? (
        <p role="alert" className="text-sm text-destructive">
          {t("calendar.weekdays_required")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!dirty || days.length === 0 || saveWeekdays.isPending} onClick={() => saveWeekdays.mutate(days)}>
          {saveWeekdays.isPending ? t("common:saving") : t("common:save")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("calendar.recompute_note")}</p>
      </div>
    </section>
  )
}

const HolidaysEditor = () => {
  const { t, i18n } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const holidays = useHolidays()
  const { createHoliday, deleteHoliday } = useCalendarMutations()
  const [date, setDate] = useState("")
  const [name, setName] = useState("")
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "vi", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!date || !name.trim()) return
    createHoliday.mutate(
      { date, name: name.trim() },
      {
        onSuccess: () => {
          setDate("")
          setName("")
        },
      },
    )
  }

  return (
    <section aria-labelledby="holidays-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 id="holidays-heading" className="text-sm font-semibold text-foreground">
          {t("calendar.holidays_title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("calendar.holidays_body")}</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="holiday-date">{t("calendar.holiday_date")}</Label>
          <Input id="holiday-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="h-10" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="holiday-name">{t("calendar.holiday_name")}</Label>
          <Input
            id="holiday-name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("calendar.holiday_name_placeholder")}
            className="h-10"
          />
        </div>
        <Button type="submit" disabled={!date || !name.trim() || createHoliday.isPending}>
          <Plus aria-hidden="true" />
          {t("calendar.holiday_add")}
        </Button>
      </form>
      {holidays.isPending ? <Skeleton className="h-16" /> : null}
      {holidays.isError ? (
        <ErrorState message={apiErrorMessage(holidays.error, tAll)} onRetry={() => void holidays.refetch()} />
      ) : null}
      {holidays.data && holidays.data.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarOff aria-hidden="true" className="size-4" />
          {t("calendar.holidays_empty")}
        </p>
      ) : null}
      {holidays.data && holidays.data.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {holidays.data.map((holiday) => (
            <li key={holiday.date} className="flex items-center gap-3 px-3 py-2 text-sm">
              <time dateTime={holiday.date} className="w-36 shrink-0 tabular-nums text-muted-foreground">
                {dateFormat.format(new Date(`${holiday.date}T00:00:00`))}
              </time>
              <span className="min-w-0 flex-1 truncate text-foreground">{holiday.name}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("calendar.holiday_remove", { name: holiday.name })}
                disabled={deleteHoliday.isPending}
                onClick={() => deleteHoliday.mutate(holiday.date)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

/** Admin-only: working weekdays and holidays that drive the 48-working-hour deadline. */
const CalendarSettingsPage = () => {
  const { t } = useTranslation("tickets")
  const { t: tAll } = useTranslation()
  const calendar = useSupportCalendar()

  return (
    <>
      <PageHeader title={t("calendar.title")} description={t("calendar.subtitle")} />
      {calendar.isPending ? <Skeleton className="h-40 rounded-xl" /> : null}
      {calendar.isError ? (
        <ErrorState message={apiErrorMessage(calendar.error, tAll)} onRetry={() => void calendar.refetch()} />
      ) : null}
      {calendar.data ? (
        <WeekdaysEditor key={calendar.data.workingWeekdays.join()} initial={calendar.data.workingWeekdays} />
      ) : null}
      <HolidaysEditor />
    </>
  )
}

export { CalendarSettingsPage }
