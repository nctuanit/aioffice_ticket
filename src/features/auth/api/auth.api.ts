import { api } from "@/lib/axios"
import {
  authTokenResponseSchema,
  localLoginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  successResponseSchema,
  userProfileResponseSchema,
  type AuthTokenResponse,
  type LocalLoginRequest,
  type LogoutRequest,
  type RefreshRequest,
  type SuccessResponse,
  type UserProfile,
} from "@/features/auth/types/auth-api.types"

const AUTH_ENDPOINTS = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
} as const

const loginWithPassword = async (
  payload: Omit<LocalLoginRequest, "provider">,
): Promise<AuthTokenResponse> => {
  const body = localLoginRequestSchema.parse({ provider: "local", ...payload })
  const { data } = await api.post(AUTH_ENDPOINTS.login, body)
  return authTokenResponseSchema.parse(data)
}

const refreshToken = async (
  payload: RefreshRequest,
): Promise<AuthTokenResponse> => {
  const body = refreshRequestSchema.parse(payload)
  const { data } = await api.post(AUTH_ENDPOINTS.refresh, body)
  return authTokenResponseSchema.parse(data)
}

const logout = async (payload: LogoutRequest): Promise<SuccessResponse> => {
  const body = logoutRequestSchema.parse(payload)
  const { data } = await api.post(AUTH_ENDPOINTS.logout, body)
  return successResponseSchema.parse(data)
}

const getCurrentUser = async (): Promise<UserProfile> => {
  const { data } = await api.get(AUTH_ENDPOINTS.me)
  return userProfileResponseSchema.parse(data)
}

export { AUTH_ENDPOINTS, getCurrentUser, loginWithPassword, logout, refreshToken }
