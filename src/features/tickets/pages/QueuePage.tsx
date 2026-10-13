import { Inbox } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/EmptyState"
import { PageHeader } from "@/shared/components/PageHeader"

/**
 * Queue placeholder (phase P5). P6 adds the data table, filters, 48h countdown and
 * polling on top of `listTickets` + `ticketKeys.list(search)`.
 */
const QueuePage = () => {
  const { t } = useTranslation("tickets")

  return (
    <>
      <PageHeader title={t("queue.title")} description={t("queue.subtitle")} />
      <EmptyState icon={Inbox} title={t("queue.empty_title")} description={t("queue.empty_body")} />
    </>
  )
}

export { QueuePage }
