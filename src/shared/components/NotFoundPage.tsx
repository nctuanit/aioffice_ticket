import { Link } from "@tanstack/react-router"
import { SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { HOME_PATH } from "@/features/auth/utils/route-guards"
import { EmptyState } from "@/shared/components/EmptyState"

const NotFoundPage = () => {
  const { t } = useTranslation("common")

  return (
    <main className="grid min-h-svh place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={SearchX}
          title={t("not_found_title")}
          description={t("not_found_body")}
          action={
            <Button asChild variant="outline">
              <Link to={HOME_PATH}>{t("go_home")}</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}

export { NotFoundPage }
