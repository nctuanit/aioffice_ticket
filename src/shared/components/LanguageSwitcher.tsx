import { Check, Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { changeAppLanguage, LANGUAGE_OPTIONS, resolveAppLanguage } from "@/i18n"
import { cn } from "@/lib/utils"

/**
 * Always-visible language picker (header and sign-in pages). A menu rather than a
 * toggle so more languages can be added without changing the layout.
 */
const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { t, i18n } = useTranslation("common")
  const current = resolveAppLanguage(i18n.resolvedLanguage ?? i18n.language)
  const currentOption = LANGUAGE_OPTIONS.find((option) => option.code === current) ?? LANGUAGE_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-11 gap-1.5 px-2.5", className)}
          aria-label={t("language_switch", { language: currentOption.label })}
        >
          <Languages aria-hidden="true" />
          <span className="text-sm font-semibold">{currentOption.shortLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGE_OPTIONS.map((option) => {
          const active = option.code === current
          return (
            <DropdownMenuItem
              key={option.code}
              lang={option.code}
              className={cn("cursor-pointer justify-between", active && "font-semibold text-primary")}
              aria-current={active ? "true" : undefined}
              onSelect={() => void changeAppLanguage(option.code)}
            >
              {option.label}
              {active ? <Check aria-hidden="true" className="size-4" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LanguageSwitcher }
