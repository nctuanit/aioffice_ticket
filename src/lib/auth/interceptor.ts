import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"

import { authTokenResponseSchema } from "@/features/auth/types/auth-api.types"
import { notifySessionExpired } from "@/lib/auth/auth-session"
import { runRefreshTask } from "@/lib/auth/refresh-queue"
import { tokenManager } from "@/lib/auth/token-manager"

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const AUTH_REFRESH_PATH = "/auth/refresh"

const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/refresh"] as const

const matchesPath = (config: AxiosRequestConfig, path: string) => {
  const url = config.url ?? ""
  return url.includes(path)
}

const isPublicAuthRequest = (config: AxiosRequestConfig) =>
  PUBLIC_AUTH_PATHS.some((path) => matchesPath(config, path))

const attachAccessToken = (config: InternalAxiosRequestConfig) => {
  const accessToken = tokenManager.getAccessToken()

  if (!accessToken) {
    return config
  }

  config.headers.Authorization = `Bearer ${accessToken}`
  return config
}

const refreshSession = async (client: AxiosInstance) => {
  const refreshToken = tokenManager.getRefreshToken()

  if (!refreshToken) {
    throw new Error("Missing refresh token")
  }

  const { data } = await client.post(AUTH_REFRESH_PATH, { refreshToken })
  const tokens = authTokenResponseSchema.parse(data)

  tokenManager.setAccessToken(tokens.accessToken)
  // the backend omits refreshToken only for cookie-transport web clients; the Hub never asks for that
  if (tokens.refreshToken) {
    tokenManager.setRefreshToken(tokens.refreshToken)
  }

  return tokens.accessToken
}

/**
 * Runs the shared refresh flow (one refresh at a time via the refresh queue). On failure
 * the session is cleared and listeners are told it expired. Also used by non-axios
 * callers such as the realtime ticket stream (fetch) after a 401.
 */
const refreshAccessToken = async (client: AxiosInstance): Promise<string> => {
  try {
    return await runRefreshTask(() => refreshSession(client))
  } catch (refreshError) {
    tokenManager.clearAll()
    notifySessionExpired()
    throw refreshError
  }
}

const handleUnauthorized = async (
  client: AxiosInstance,
  error: AxiosError,
) => {
  const originalRequest = error.config as RetryableRequestConfig | undefined

  if (
    !originalRequest ||
    originalRequest._retry ||
    isPublicAuthRequest(originalRequest) ||
    !tokenManager.getRefreshToken()
  ) {
    return Promise.reject(error)
  }

  originalRequest._retry = true

  const accessToken = await refreshAccessToken(client)
  originalRequest.headers.Authorization = `Bearer ${accessToken}`
  return client(originalRequest)
}

const setupAuthInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config) => attachAccessToken(config),
    (error: Error) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status !== 401) {
        return Promise.reject(error)
      }

      return handleUnauthorized(client, error)
    },
  )
}

export { refreshAccessToken, setupAuthInterceptors }
