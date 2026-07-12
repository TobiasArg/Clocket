import { memo } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
export interface TransactionDeleteConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  messageLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  titleLabel?: string;
  transactionName?: string;
}

export const TransactionDeleteConfirmDialog = memo(function TransactionDeleteConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Eliminar",
  isLoading = false,
  isOpen = false,
  messageLabel = "Esta acción eliminará la transacción seleccionada.",
  onCancel,
  onConfirm,
  titleLabel = "Confirmar eliminación",
  transactionName = "",
}: TransactionDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      isLoading={isLoading}
      titleLabel={titleLabel}
      messageLabel={messageLabel}
      detailLabel={transactionName}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
});
