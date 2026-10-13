import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    data-slot="textarea"
    className={cn(
      "flex min-h-24 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm leading-6 text-foreground shadow-xs transition-[color,box-shadow,border-color] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      className,
    )}
    {...props}
  />
)

export { Textarea }
