import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type UnsentDraftDialogProps = {
  open: boolean
  onStay: () => void
  onLeave: () => void
}

/**
 * "You have an unsent message" before leaving a ticket (route change, closing or switching
 * the detail sheet). The text itself survives as a local draft; attachments do not.
 */
const UnsentDraftDialog = ({ open, onStay, onLeave }: UnsentDraftDialogProps) => {
  const { t } = useTranslation("tickets")
  const { t: tCommon } = useTranslation("common")

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onStay()}>
      <DialogContent role="alertdialog" closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle>{t("unsent.title")}</DialogTitle>
          <DialogDescription>{t("unsent.body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onStay} autoFocus>
            {t("unsent.stay")}
          </Button>
          <Button onClick={onLeave}>{t("unsent.leave")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { UnsentDraftDialog }
