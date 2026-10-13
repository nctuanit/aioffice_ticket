import { useEffect } from "react"

import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  runRefreshTask,
  subscribeSessionExpired,
  tokenManager,
} from "@/lib/auth"
import { queryClient } from "@/lib/query-client"

/** Restores the stored session on boot and sends the user to /login when it expires. */
const AuthSessionManager = () => {
  const navigate = useNavigate()
  const { t } = useTranslation("auth")
  const login = useAuthStore((state) => state.login)
  const clear = useAuthStore((state) => state.clear)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  useEffect(() => {
    const unsubscribe = subscribeSessionExpired(() => {
      clear()
      queryClient.clear()
      toast.error(t("errors.session_expired"))
      void navigate({ to: "/login" })
    })
    return unsubscribe
  }, [clear, navigate, t])

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!tokenManager.getRefreshToken()) {
        setLoading(false)
        return
      }
      try {
        const accessToken = await runRefreshTask(async () => {
          const tokens = await authService.refresh()
          return tokens.accessToken
        })
        setAccessToken(accessToken)
        const user = await authService.getCurrentUser()
        login(user, accessToken)
      } catch (error) {
        clear()
        console.error("Unable to restore the session", error)
      } finally {
        setLoading(false)
      }
    }
    void bootstrapSession()
  }, [clear, login, setAccessToken, setLoading])

  return null
}

export { AuthSessionManager }
