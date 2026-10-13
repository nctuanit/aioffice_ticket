import { useTranslation } from "react-i18next"

/** Full-screen boot state while the stored session is restored. */
const AppLoadingScreen = () => {
  const { t } = useTranslation("common")

  return (
    <div
      aria-label={t("loading")}
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-background"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary-glow)]">
          <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M5 7h14a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5a2 2 0 0 0 0-4V8a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
            <path d="M9 11.5h6M9 14.5h4" strokeLinecap="round" />
          </svg>
        </div>
        <div aria-hidden="true" className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[hub-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-3/5 motion-reduce:animate-none" />
        </div>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
      <style>{`@keyframes hub-progress { from { transform: translateX(-100%); } to { transform: translateX(300%); } }`}</style>
    </div>
  )
}

export { AppLoadingScreen }
