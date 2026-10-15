import type { CSSProperties, PropsWithChildren } from "react"

import { QueryClientProvider } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Toaster } from "sonner"

import { queryClient } from "@/lib/query-client"

/**
 * Sonner's 356px default is narrow for the 18px root. 21rem + the 1.5rem offset stays clear of the
 * ticket detail's left column (composer, Send) from lg up, where the toast sits over the side panel.
 */
const TOASTER_STYLE = { "--width": "21rem" } as CSSProperties

/**
 * Bottom-right, clear of the header icon cluster and the page-header view switcher that
 * top-right used to cover. ≤600px sonner spreads toasts across the screen: keep a gutter
 * on both sides. Region and close-button labels follow the UI language.
 */
const AppToaster = () => {
  const { t } = useTranslation("common")
  return (
    <Toaster
      position="bottom-right"
      offset={{ right: "1.5rem", bottom: "1.5rem" }}
      mobileOffset={{ right: "1rem", bottom: "1rem", left: "1rem" }}
      style={TOASTER_STYLE}
      richColors
      closeButton
      containerAriaLabel={t("toasts.region")}
      toastOptions={{ closeButtonAriaLabel: t("toasts.close") }}
    />
  )
}

const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <AppToaster />
  </QueryClientProvider>
)

export { AppProviders }
