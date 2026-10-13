import { useMutation } from "@tanstack/react-query"

import { authKeys } from "@/features/auth/api/auth.keys"
import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { queryClient } from "@/lib/query-client"

const useLogoutMutation = () => {
  const clear = useAuthStore((state) => state.clear)

  return useMutation({
    mutationKey: [...authKeys.all, "logout"],
    mutationFn: async () => {
      await authService.logout()
      return { success: true as const }
    },
    onSettled: async () => {
      clear()
      await queryClient.clear()
    },
  })
}

export { useLogoutMutation }
