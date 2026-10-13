import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

type PaginationProps = {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

const Pagination = ({ page, totalPages, total, onPageChange }: PaginationProps) => {
  const { t } = useTranslation("common")
  if (totalPages <= 1) return null

  return (
    <nav aria-label={t("pagination.label")} className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span aria-live="polite">{t("pagination.summary", { page, totalPages, total })}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden="true" />
          {t("pagination.prev")}
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t("pagination.next")}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

export { Pagination }
