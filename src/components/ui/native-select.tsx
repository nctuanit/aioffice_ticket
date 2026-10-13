import type { ComponentProps } from "react"

import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Styled native `<select>`: keyboard, screen reader and mobile pickers work out of the
 * box, which matters more than custom popovers for dense filter bars.
 */
const NativeSelect = ({ className, children, ...props }: ComponentProps<"select">) => (
  <div data-slot="native-select" className={cn("relative", className)}>
    <select
      className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-input pr-9 pl-3 text-sm text-foreground transition-[color,box-shadow,border-color] duration-200 outline-none hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
)

export { NativeSelect }
