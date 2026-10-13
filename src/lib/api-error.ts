import { isAxiosError } from "axios"
import type { TFunction } from "i18next"

type ApiErrorBody = { code?: string; message?: string | string[] }

/** Backend error code (`TICKET_INVALID_TRANSITION`, …) or null. */
const apiErrorCode = (error: unknown): string | null => {
  if (!isAxiosError(error)) return null
  return (error.response?.data as ApiErrorBody | undefined)?.code ?? null
}

const apiErrorStatus = (error: unknown): number | null =>
  isAxiosError(error) ? (error.response?.status ?? null) : null

/**
 * User-facing message. open-office localizes `message` from the `x-locale` header, so it
 * is shown as-is; network failures and unknown errors fall back to common keys.
 */
const apiErrorMessage = (error: unknown, t: TFunction): string => {
  if (isAxiosError(error)) {
    if (!error.response) return t("common:error_network")
    const message = (error.response.data as ApiErrorBody | undefined)?.message
    if (Array.isArray(message) && message.length) return message.join(". ")
    if (typeof message === "string" && message.trim()) return message
  }
  return t("common:error_generic")
}

export { apiErrorCode, apiErrorMessage, apiErrorStatus }
