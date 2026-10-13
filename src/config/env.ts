type AppEnv = {
  apiBaseUrl: string
  apiTimeoutMs: number
}

const DEFAULT_API_TIMEOUT_MS = 30_000
const LOCAL_API_BASE_URL = "http://localhost:4901/api"

const resolveApiBaseUrl = () => {
  const value = import.meta.env.VITE_API_URL

  if (typeof value === "string" && value.length > 0) {
    return value.replace(/\/$/, "")
  }

  // Dev defaults to the local open-office backend; a production build must set VITE_API_URL.
  if (import.meta.env.DEV) {
    return LOCAL_API_BASE_URL
  }
  throw new Error("Missing VITE_API_URL environment variable")
}

const env: AppEnv = {
  apiBaseUrl: resolveApiBaseUrl(),
  apiTimeoutMs: DEFAULT_API_TIMEOUT_MS,
}

if (import.meta.env.DEV) {
  console.info(`[api] baseURL = ${env.apiBaseUrl}`)
}

export { env }
