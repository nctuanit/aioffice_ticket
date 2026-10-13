import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Guides the user when a list has no content: what it is and what to do next. */
const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
    <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
      <Icon aria-hidden="true" className="size-6" />
    </div>
    <div className="max-w-sm">
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
)

export { EmptyState }
