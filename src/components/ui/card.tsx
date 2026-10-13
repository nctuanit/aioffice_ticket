import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const Card = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card"
    className={cn(
      "flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]",
      className,
    )}
    {...props}
  />
)

const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-header"
    className={cn("flex flex-col gap-1.5 px-7 pt-7 sm:px-8 sm:pt-8", className)}
    {...props}
  />
)

const CardTitle = ({ className, ...props }: ComponentProps<"h1">) => (
  <h1
    data-slot="card-title"
    className={cn("font-display text-2xl font-semibold tracking-[-0.03em]", className)}
    {...props}
  />
)

const CardDescription = ({ className, ...props }: ComponentProps<"p">) => (
  <p
    data-slot="card-description"
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
)

const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-content"
    className={cn("px-7 pb-7 pt-6 sm:px-8 sm:pb-8", className)}
    {...props}
  />
)

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
