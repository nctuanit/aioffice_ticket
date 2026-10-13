import type { InitOptions } from "i18next"

import {
  DEFAULT_LANGUAGE,
  I18N_NAMESPACES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "@/i18n/constants"
import { resources } from "@/i18n/resources"

const i18nConfig = {
  resources,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  defaultNS: "common",
  ns: [...I18N_NAMESPACES],
  returnNull: false,
  returnEmptyString: false,
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    lookupLocalStorage: LANGUAGE_STORAGE_KEY,
  },
  react: {
    useSuspense: false,
  },
} satisfies InitOptions

export { i18nConfig }
