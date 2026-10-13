const DEFAULT_LANGUAGE = "vi" as const

const SUPPORTED_LANGUAGES = ["vi", "en"] as const

const I18N_NAMESPACES = ["common", "auth", "tickets"] as const

const LANGUAGE_STORAGE_KEY = "ticket-hub.language"

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh"

const LANGUAGE_OPTIONS = [
  { code: "vi", label: "Tiếng Việt", shortLabel: "VI" },
  { code: "en", label: "English", shortLabel: "EN" },
] as const

export {
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  I18N_NAMESPACES,
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
}
