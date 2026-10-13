import { useQuery } from "@tanstack/react-query"

import { authKeys } from "@/features/auth/api/auth.keys"
import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { tokenManager } from "@/lib/auth"

const useCurrentUser = () => {
  const setUser = useAuthStore((state) => state.setUser)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasAccessToken = Boolean(tokenManager.getAccessToken())

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const user = await authService.getCurrentUser()
      setUser(user)
      return user
    },
    enabled: isAuthenticated || hasAccessToken,
  })
}

export { useCurrentUser }
