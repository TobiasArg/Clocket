import { useEffect, useState } from "react";
import {
  downloadJsonExport,
  downloadTransactionsCsvExport,
} from "@/utils";
import { SettingsModalShell } from "../SettingsModalShell";

export interface ExportDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess?: (message: string) => void;
}

export function ExportDataPopup({
  isOpen,
  onClose,
  onExportSuccess,
}: ExportDataPopupProps) {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setError(null);
    setIsExportingJson(false);
    setIsExportingCsv(false);
  }, [isOpen]);

  const isBusy = isExportingJson || isExportingCsv;

  const handleJsonExport = async (): Promise<void> => {
    setError(null);
    setIsExportingJson(true);

    try {
      await downloadJsonExport();
      onExportSuccess?.("Backup JSON descargado");
    } catch {
      setError("No pudimos generar el backup JSON.");
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleCsvExport = async (): Promise<void> => {
    setError(null);
    setIsExportingCsv(true);

    try {
      await downloadTransactionsCsvExport();
      onExportSuccess?.("CSV de transacciones descargado");
    } catch {
      setError("No pudimos generar el CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar datos"
      subtitle="Descarga una copia de seguridad o el detalle de transacciones."
    >
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            void handleJsonExport();
          }}
          disabled={isBusy}
          className="flex items-center justify-between rounded-2xl bg-[var(--text-primary)] px-3 py-3 text-left text-[var(--panel-bg)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Backup JSON</span>
            <span className="text-xs font-medium text-white/80">Incluye configuración y datos clave</span>
          </span>
          <span className="text-xs font-semibold">{isExportingJson ? "Generando..." : "Descargar"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            void handleCsvExport();
          }}
          disabled={isBusy}
          className="flex items-center justify-between rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-3 text-left text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex flex-col">
            <span className="text-sm font-semibold">CSV transacciones</span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">Formato listo para análisis externo</span>
          </span>
          <span className="text-xs font-semibold">{isExportingCsv ? "Generando..." : "Descargar"}</span>
        </button>

        {error && (
          <span className="rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--surface-border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
