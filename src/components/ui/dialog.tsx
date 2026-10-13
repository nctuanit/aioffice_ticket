import type { ComponentProps } from "react"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

const DialogOverlay = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/50 data-[state=open]:animate-[hub-fade-in_150ms_ease-out]",
      className,
    )}
    {...props}
  />
)

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel: string
  /** `sheet` slides in from the right edge (detail panel); `dialog` is centered. */
  variant?: "dialog" | "sheet"
}

const DialogContent = ({
  className,
  children,
  closeLabel,
  variant = "dialog",
  ...props
}: DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        "fixed z-50 flex flex-col bg-card text-card-foreground shadow-xl outline-none",
        variant === "dialog" &&
          "top-1/2 left-1/2 max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border p-6 data-[state=open]:animate-[hub-pop-in_160ms_ease-out]",
        variant === "sheet" &&
          "inset-y-0 right-0 h-full w-full max-w-3xl border-l border-border data-[state=open]:animate-[hub-slide-in_200ms_ease-out]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label={closeLabel}
        className="absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
)

const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn("font-display text-lg font-semibold text-foreground", className)}
    {...props}
  />
)

const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
)

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
