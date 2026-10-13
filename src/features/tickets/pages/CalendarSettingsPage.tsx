import { CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/EmptyState"
import { PageHeader } from "@/shared/components/PageHeader"

/** Admin-only working-calendar placeholder (phase P5): the editor arrives in P6. */
const CalendarSettingsPage = () => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")

  return (
    <>
      <PageHeader title={t("calendar.title")} description={t("calendar.subtitle")} />
      <EmptyState
        icon={CalendarDays}
        title={tCommon("coming_soon_title")}
        description={tCommon("coming_soon_body")}
      />
    </>
  )
}

export { CalendarSettingsPage }
