import { memo } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";

export interface InvestmentDeleteConfirmDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  ticker?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const InvestmentDeleteConfirmDialog = memo(function InvestmentDeleteConfirmDialog({
  isOpen,
  isLoading = false,
  ticker = "",
  onCancel,
  onConfirm,
}: InvestmentDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      isLoading={isLoading}
      rootClassName="absolute inset-0 z-[60]"
      titleLabel="Confirmar eliminación"
      messageLabel="Esta acción eliminará la posición seleccionada del portafolio."
      detailLabel={ticker}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
});
