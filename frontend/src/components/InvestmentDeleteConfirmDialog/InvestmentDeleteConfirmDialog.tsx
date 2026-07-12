import { memo } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";

export interface InvestmentDeleteConfirmDialogProps {
  confirmLabel?: string;
  isOpen: boolean;
  isLoading?: boolean;
  messageLabel?: string;
  titleLabel?: string;
  ticker?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const InvestmentDeleteConfirmDialog = memo(function InvestmentDeleteConfirmDialog({
  confirmLabel = "Eliminar",
  isOpen,
  isLoading = false,
  messageLabel = "Esta acción eliminará la posición seleccionada del portafolio.",
  titleLabel = "Confirmar eliminación",
  ticker = "",
  onCancel,
  onConfirm,
}: InvestmentDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      isLoading={isLoading}
      rootClassName="absolute inset-0 z-[60]"
      titleLabel={titleLabel}
      messageLabel={messageLabel}
      detailLabel={ticker}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
});
