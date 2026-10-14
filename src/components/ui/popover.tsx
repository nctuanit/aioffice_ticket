import type { ComponentProps } from "react"

import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = (props: ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
)

const PopoverTrigger = (props: ComponentProps<typeof PopoverPrimitive.Trigger>) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
)

const PopoverAnchor = (props: ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
)

const PopoverClose = (props: ComponentProps<typeof PopoverPrimitive.Close>) => (
  <PopoverPrimitive.Close data-slot="popover-close" {...props} />
)

/**
 * Anchored panel (`role="dialog"`, so the global single-key shortcuts pause while it is open).
 * `hub-fade-in` rather than `hub-pop-in`: the latter carries the centered dialog's translate(-50%, -50%),
 * which would shift a popper-positioned element mid-animation.
 */
const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 8,
  collisionPadding = 16,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        "z-50 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl outline-none data-[state=open]:animate-[hub-fade-in_150ms_ease-out]",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
)

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger }
