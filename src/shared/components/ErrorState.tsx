import { AlertTriangle, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/** Inline failure block for a list or panel, with a retry action. */
const ErrorState = ({ message, onRetry, retrying = false, className }: ErrorStateProps) => {
  const { t } = useTranslation("common")

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="size-6 text-destructive" />
      <p className="max-w-md text-sm leading-6 text-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RotateCcw aria-hidden="true" className={cn(retrying && "animate-spin")} />
          {t("retry")}
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
