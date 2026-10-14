import { Fragment } from "react"

import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Shortcut = { id: string; keys: string[][] }

/** `keys`: alternatives (outer, "or") made of sequences (inner, "then"). */
const GROUPS: Array<{ id: "general" | "detail"; items: Shortcut[] }> = [
  {
    id: "general",
    items: [
      { id: "search", keys: [["/"]] },
      { id: "go_dashboard", keys: [["G", "D"]] },
      { id: "go_queue", keys: [["G", "Q"]] },
      { id: "go_board", keys: [["G", "B"]] },
      { id: "help", keys: [["?"]] },
    ],
  },
  {
    id: "detail",
    items: [
      { id: "reply", keys: [["R"]] },
      { id: "note", keys: [["N"]] },
      { id: "claim", keys: [["C"]] },
      { id: "next", keys: [["J"], ["→"]] },
      { id: "prev", keys: [["K"], ["←"]] },
      { id: "send", keys: [["Ctrl", "Enter"]] },
      { id: "close", keys: [["Esc"]] },
    ],
  },
]

const Kbd = ({ children }: { children: string }) => (
  <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-border-strong bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground shadow-[inset_0_-1px_0_var(--border-strong)]">
    {children}
  </kbd>
)

/** Lists every keyboard shortcut (opened with `?` or the keyboard button in the top bar). */
const ShortcutsHelpDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")

  const renderKeys = (keys: string[][]) =>
    keys.map((sequence, alternative) => (
      <Fragment key={sequence.join("+")}>
        {alternative > 0 ? <span className="text-xs text-muted-foreground">{t("shortcuts.or")}</span> : null}
        {sequence.map((key, step) => (
          <Fragment key={key}>
            {step > 0 ? (
              <span className="text-xs text-muted-foreground">
                {sequence[0] === "Ctrl" ? "+" : t("shortcuts.then")}
              </span>
            ) : null}
            <Kbd>{key}</Kbd>
          </Fragment>
        ))}
      </Fragment>
    ))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>
        {GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`shortcuts-${group.id}`} className="flex flex-col gap-2">
            <h3 id={`shortcuts-${group.id}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(`shortcuts.groups.${group.id}`)}
            </h3>
            <dl className="flex flex-col divide-y divide-border">
              {group.items.map((item) => (
                <div key={item.id} className="flex min-h-10 items-center justify-between gap-4 py-1.5">
                  <dt className="text-sm text-foreground">{t(`shortcuts.items.${item.id}`)}</dt>
                  <dd className="flex shrink-0 items-center gap-1">{renderKeys(item.keys)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  )
}

export { ShortcutsHelpDialog }
