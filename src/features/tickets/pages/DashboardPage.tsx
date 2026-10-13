import { BarChart3 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/EmptyState"
import { PageHeader } from "@/shared/components/PageHeader"

/** Overview placeholder (phase P5): stats cards (unassigned, expiring ≤ 6h, …) arrive in P6. */
const DashboardPage = () => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")

  return (
    <>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />
      <EmptyState
        icon={BarChart3}
        title={tCommon("coming_soon_title")}
        description={tCommon("coming_soon_body")}
      />
    </>
  )
}

export { DashboardPage }
