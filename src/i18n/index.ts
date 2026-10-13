import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { i18nConfig } from "@/i18n/config"
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "@/i18n/constants"
import type { AppLanguage } from "@/i18n/types"

const isAppLanguage = (value: string | null | undefined): value is AppLanguage =>
  SUPPORTED_LANGUAGES.some((language) => language === value)

const resolveAppLanguage = (value: string | null | undefined): AppLanguage => {
  const normalized = value?.toLowerCase().split("-")[0]
  return isAppLanguage(normalized) ? normalized : DEFAULT_LANGUAGE
}

const applyDocumentLanguage = (language: AppLanguage) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language
  }
}

const changeAppLanguage = async (language: AppLanguage) => {
  await i18n.changeLanguage(language)
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  applyDocumentLanguage(language)
}

const initializeI18n = async () => {
  if (i18n.isInitialized) {
    return i18n
  }
  await i18n.use(LanguageDetector).use(initReactI18next).init(i18nConfig)
  applyDocumentLanguage(
    resolveAppLanguage(i18n.resolvedLanguage ?? i18n.language),
  )
  return i18n
}

await initializeI18n()

export { changeAppLanguage, i18n, isAppLanguage, resolveAppLanguage }
export {
  DEFAULT_LANGUAGE,
  I18N_NAMESPACES,
  LANGUAGE_OPTIONS,
  SUPPORTED_LANGUAGES,
} from "@/i18n/constants"
export type { AppLanguage, I18nNamespace, LanguageOption } from "@/i18n/types"
