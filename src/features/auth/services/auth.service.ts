import {
  getCurrentUser,
  loginWithPassword,
  logout,
  refreshToken,
} from "@/features/auth/api/auth.api"
import {
  isStaffRole,
  type AuthTokenResponse,
  type UserProfile,
} from "@/features/auth/types/auth-api.types"
import { tokenManager } from "@/lib/auth"

type AuthSessionResult = {
  tokens: AuthTokenResponse
  user: UserProfile
}

/** Thrown after a successful login when the account is not admin / support. */
class ForbiddenRoleError extends Error {
  readonly role: UserProfile["role"]

  constructor(role: UserProfile["role"]) {
    super("ROLE_NOT_ALLOWED")
    this.name = "ForbiddenRoleError"
    this.role = role
  }
}

const persistTokens = (tokens: AuthTokenResponse) => {
  tokenManager.setAccessToken(tokens.accessToken)
  if (tokens.refreshToken) {
    tokenManager.setRefreshToken(tokens.refreshToken)
  }
}

const authService = {
  /**
   * Login, then load the profile and enforce the Hub's role gate. A non-staff
   * account is signed out again on the server so no session lingers.
   */
  login: async (payload: {
    email: string
    password: string
  }): Promise<AuthSessionResult> => {
    const tokens = await loginWithPassword(payload)
    persistTokens(tokens)
    const user = await getCurrentUser()
    if (!isStaffRole(user.role)) {
      await authService.logout().catch(() => undefined)
      throw new ForbiddenRoleError(user.role)
    }
    return { tokens, user }
  },

  refresh: async (): Promise<AuthTokenResponse> => {
    const currentRefreshToken = tokenManager.getRefreshToken()
    if (!currentRefreshToken) {
      throw new Error("Missing refresh token")
    }
    const tokens = await refreshToken({ refreshToken: currentRefreshToken })
    persistTokens(tokens)
    return tokens
  },

  logout: async () => {
    const currentRefreshToken = tokenManager.getRefreshToken()
    if (currentRefreshToken) {
      await logout({ refreshToken: currentRefreshToken })
    }
    tokenManager.clearAll()
  },

  getCurrentUser: () => getCurrentUser(),
}

export { authService, ForbiddenRoleError }
export type { AuthSessionResult }
