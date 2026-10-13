import { useNavigate } from "@tanstack/react-router"
import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLogoutMutation } from "@/features/auth/hooks/useLogoutMutation"

/** A signed-in account without the admin / support role lands here. */
const NoAccessPage = () => {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()

  const switchAccount = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined)
    await navigate({ to: "/login" })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-2 grid size-11 place-items-center rounded-xl bg-warning/15 text-warning">
          <ShieldAlert aria-hidden="true" className="size-6" />
        </div>
        <CardTitle>{t("no_access.title")}</CardTitle>
        <CardDescription>{t("no_access.body")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline" disabled={logoutMutation.isPending} onClick={switchAccount}>
          {t("no_access.switch_account")}
        </Button>
      </CardContent>
    </Card>
  )
}

export { NoAccessPage }
