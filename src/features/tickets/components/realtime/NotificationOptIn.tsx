import { useState } from "react"

import { BellRing } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

const supported = () => typeof window !== "undefined" && "Notification" in window

/**
 * Opt-in for browser notifications about new customer tickets (shown only while the tab
 * is hidden). Never prompts on its own: the permission request only follows this click,
 * and the button disappears once the user has decided either way.
 */
const NotificationOptIn = () => {
  const { t } = useTranslation("common")
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    supported() ? Notification.permission : "unsupported",
  )
  if (permission !== "default") return null

  const enable = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") toast.success(t("realtime.notifications_enabled"))
    else if (result === "denied") toast.info(t("realtime.notifications_blocked"))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={t("realtime.enable_notifications")}
      title={t("realtime.enable_notifications")}
      onClick={() => void enable()}
    >
      <BellRing aria-hidden="true" />
    </Button>
  )
}

export { NotificationOptIn }
