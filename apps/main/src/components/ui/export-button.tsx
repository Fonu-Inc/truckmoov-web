import {Download} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, type ExportColumn } from "@/lib/exportTable";
import { toast } from "sonner";

interface ExportButtonProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}

/**
 * Standard table export button. Place at the top-right of any table container.
 * Exports current rows to CSV (Excel-compatible).
 */
export function ExportButton<T>({
  rows,
  columns,
  filename,
  label = "Export Data",
  size = "sm",
  disabled }: ExportButtonProps<T>) {
  const handleExport = () => {
    if (!rows || rows.length === 0) {
      toast.info("Nothing to export");
      return;
    }
    try {
      exportToCSV(rows, columns, filename);
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error("Export failed");
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleExport}
      disabled={disabled}
      className="bg-transparent border-input"
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
