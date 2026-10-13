import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type InputProps = ComponentProps<"input"> & {
  error?: boolean
}

const Input = ({ className, type, error = false, ...props }: InputProps) => (
  <input
    type={type}
    data-slot="input"
    aria-invalid={error || undefined}
    className={cn(
      "flex h-11 w-full rounded-lg border border-input bg-input/65 px-3.5 py-2 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-sm placeholder:text-muted-foreground/70 hover:border-border-strong focus-visible:border-primary focus-visible:bg-input focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
      className,
    )}
    {...props}
  />
)

export { Input }
