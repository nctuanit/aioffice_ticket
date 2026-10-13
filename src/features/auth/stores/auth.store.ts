import { create } from "zustand"

import type { UserProfile } from "@/features/auth/types/auth-api.types"
import { tokenManager } from "@/lib/auth"

type AuthState = {
  user: UserProfile | null
  isAuthenticated: boolean
  /** true while the stored session is being restored on boot */
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setAccessToken: (accessToken: string | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: UserProfile, accessToken: string) => void
  clear: () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  setAccessToken: (accessToken) => {
    tokenManager.setAccessToken(accessToken)
    set({ isAuthenticated: Boolean(accessToken) })
  },

  setLoading: (isLoading) => set({ isLoading }),

  login: (user, accessToken) => {
    tokenManager.setAccessToken(accessToken)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  clear: () => {
    tokenManager.clearAll()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

export { useAuthStore }
