import {
  I18N_NAMESPACES,
  LANGUAGE_OPTIONS,
  SUPPORTED_LANGUAGES,
} from "@/i18n/constants"

type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

type I18nNamespace = (typeof I18N_NAMESPACES)[number]

type LanguageOption = (typeof LANGUAGE_OPTIONS)[number]

export type { AppLanguage, I18nNamespace, LanguageOption }
