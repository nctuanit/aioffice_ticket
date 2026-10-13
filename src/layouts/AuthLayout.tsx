import type { PropsWithChildren } from "react"

import { useTranslation } from "react-i18next"

/** Centered card on a quiet background for login and access pages. */
const AuthLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation("common")

  return (
    <main className="min-h-svh overflow-y-auto bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M5 7h14a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5a2 2 0 0 0 0-4V8a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
              <path d="M9 11.5h6M9 14.5h4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">{t("app_name")}</p>
            <p className="text-sm text-muted-foreground">{t("app_tagline")}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}

export { AuthLayout }
