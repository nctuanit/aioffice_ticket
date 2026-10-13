const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
]

const relativeTime = (iso: string, locale: string, now = Date.now()) => {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  let duration = (new Date(iso).getTime() - now) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return formatter.format(Math.round(duration), "year")
}

const formatDateTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))

/** Display name of a user summary: full name, else email, else empty. */
const userLabel = (user: { fullName?: string | null; email?: string | null } | null | undefined) =>
  user?.fullName || user?.email || ""

export { formatDateTime, relativeTime, userLabel }
