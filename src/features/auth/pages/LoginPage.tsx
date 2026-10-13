import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/features/auth/components/LoginForm"

const LoginPage = () => {
  const { t } = useTranslation("auth")

  return (
    <Card className="w-full max-w-md shadow-[0_24px_60px_-28px_rgb(15_23_42/25%)]">
      <CardHeader>
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}

export { LoginPage }
