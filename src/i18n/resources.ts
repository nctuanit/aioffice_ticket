import authEn from "@/i18n/locales/en/auth.json"
import commonEn from "@/i18n/locales/en/common.json"
import ticketsEn from "@/i18n/locales/en/tickets.json"
import authVi from "@/i18n/locales/vi/auth.json"
import commonVi from "@/i18n/locales/vi/common.json"
import ticketsVi from "@/i18n/locales/vi/tickets.json"

const resources = {
  vi: {
    common: commonVi,
    auth: authVi,
    tickets: ticketsVi,
  },
  en: {
    common: commonEn,
    auth: authEn,
    tickets: ticketsEn,
  },
} as const

export { resources }
