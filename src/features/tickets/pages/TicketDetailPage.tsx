import { Link, useParams, useRouter } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { TicketDetailView } from "@/features/tickets/components/detail/TicketDetailView"

/** Full-page ticket detail: conversation and composer on the left, handling panel on the right. */
const TicketDetailPage = () => {
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()
  // the pathless "hub" layout route prefixes the route id
  const { ticketId } = useParams({ from: "/hub/tickets/$ticketId" })
  const canGoBack = router.history.length > 1

  return (
    <>
      <div>
        {canGoBack ? (
          <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
            <ArrowLeft aria-hidden="true" />
            {tCommon("back")}
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link to="/tickets">
              <ArrowLeft aria-hidden="true" />
              {tCommon("back")}
            </Link>
          </Button>
        )}
      </div>
      <TicketDetailView ticketId={ticketId} />
    </>
  )
}

export { TicketDetailPage }
