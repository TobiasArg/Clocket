import { useState } from "react";
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
      subtitle="Descarga un backup JSON o transacciones CSV"
    >
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            void handleJsonExport();
          }}
          disabled={isExportingJson || isExportingCsv}
          className="rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white"
        >
          {isExportingJson ? "Generando JSON..." : "Descargar backup JSON"}
        </button>

        <button
          type="button"
          onClick={() => {
            void handleCsvExport();
          }}
          disabled={isExportingJson || isExportingCsv}
          className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-semibold text-[#3F3F46]"
        >
          {isExportingCsv ? "Generando CSV..." : "Descargar CSV de transacciones"}
        </button>

        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A]"
          >
            Volver a settings
          </button>
        </div>

        {error && (
          <span className="text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}
      </div>
    </SettingsModalShell>
  );
}
