import type { Resource } from "i18next"

import { I18N_NAMESPACES, SUPPORTED_LANGUAGES } from "@/i18n/constants"

/**
 * Every `locales/<language>/<namespace>.json` is bundled automatically, so adding a
 * language means: add its folder with one file per namespace, then list it in
 * `SUPPORTED_LANGUAGES` / `LANGUAGE_OPTIONS` (`@/i18n/constants`).
 * `bun run check:i18n` fails when a language is missing keys.
 */
const files = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", {
  eager: true,
  import: "default",
})

const resources: Resource = {}

for (const language of SUPPORTED_LANGUAGES) {
  resources[language] = {}
  for (const namespace of I18N_NAMESPACES) {
    const bundle = files[`./locales/${language}/${namespace}.json`]
    if (bundle) resources[language][namespace] = bundle
  }
}

export { resources }
