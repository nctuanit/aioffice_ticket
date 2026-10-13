import { useMutation } from "@tanstack/react-query"

import { authKeys } from "@/features/auth/api/auth.keys"
import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { queryClient } from "@/lib/query-client"

const useLoginMutation = () => {
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationKey: [...authKeys.all, "login"],
    mutationFn: async (payload: { email: string; password: string }) => {
      const result = await authService.login(payload)
      login(result.user, result.tokens.accessToken)
      await queryClient.invalidateQueries({ queryKey: authKeys.me() })
      return result
    },
  })
}

export { useLoginMutation }
