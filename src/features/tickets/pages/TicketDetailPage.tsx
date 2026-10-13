import { Link, useParams } from "@tanstack/react-router"
import { ArrowLeft, Construction } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/EmptyState"
import { PageHeader } from "@/shared/components/PageHeader"

/** Detail placeholder (phase P5): conversation, reply box and side panel arrive in P6. */
const TicketDetailPage = () => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")
  // the pathless "hub" layout route prefixes the route id
  const { ticketId } = useParams({ from: "/hub/tickets/$ticketId" })

  return (
    <>
      <PageHeader
        title={t("detail.title")}
        description={ticketId}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/tickets">
              <ArrowLeft aria-hidden="true" />
              {tCommon("back")}
            </Link>
          </Button>
        }
      />
      <EmptyState
        icon={Construction}
        title={tCommon("coming_soon_title")}
        description={tCommon("coming_soon_body")}
      />
    </>
  )
}

export { TicketDetailPage }
