import { memo } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
export interface AccountDeleteConfirmDialogProps {
  accountName?: string;
  confirmLabel?: string;
  countLabel?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  messageLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  titleLabel?: string;
}

export const AccountDeleteConfirmDialog = memo(function AccountDeleteConfirmDialog({
  accountName = "",
  confirmLabel = "Eliminar",
  countLabel = "transacciones asociadas",
  isLoading = false,
  isOpen = false,
  messageLabel = "Esta acción eliminará la cuenta seleccionada.",
  onCancel,
  onConfirm,
  titleLabel = "Confirmar eliminación",
}: AccountDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      isLoading={isLoading}
      titleLabel={titleLabel}
      messageLabel={`${messageLabel} ${countLabel}`}
      detailLabel={accountName}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
});
