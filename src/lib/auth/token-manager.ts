const REFRESH_TOKEN_STORAGE_KEY = "ticket-hub.refresh-token"

let accessToken: string | null = null

const canUseSessionStorage = () => typeof window !== "undefined"

const tokenManager = {
  setAccessToken: (token: string | null) => {
    accessToken = token
  },

  getAccessToken: () => accessToken,

  clearAccessToken: () => {
    accessToken = null
  },

  setRefreshToken: (token: string | null) => {
    if (!canUseSessionStorage()) {
      return
    }

    if (token) {
      window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token)
      return
    }

    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  },

  getRefreshToken: () => {
    if (!canUseSessionStorage()) {
      return null
    }

    return window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  },

  clearRefreshToken: () => {
    if (!canUseSessionStorage()) {
      return
    }

    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  },

  clearAll: () => {
    tokenManager.clearAccessToken()
    tokenManager.clearRefreshToken()
  },

  hasSession: () => Boolean(tokenManager.getRefreshToken()),
}

export { tokenManager }
