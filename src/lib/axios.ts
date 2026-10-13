import axios from "axios"

import { env } from "@/config/env"
import { i18n } from "@/i18n"
import { setupAuthInterceptors } from "@/lib/auth"

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // The Hub runs on its own origin: refresh tokens travel in the body (token-manager),
  // not in the backend's HttpOnly cookie, so no credentials are sent cross-site.
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type")
  }
  // Backend localizes error messages from this header.
  const language = (i18n.resolvedLanguage ?? i18n.language ?? "").split("-")[0]
  if (language) {
    config.headers.set("x-locale", language)
  }
  return config
})

setupAuthInterceptors(api)

export { api }
