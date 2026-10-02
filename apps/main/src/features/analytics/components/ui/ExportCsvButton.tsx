import { Download } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { exportToCSV, type ExportColumn } from "@/lib/exportTable";

export function ExportCsvButton<T>({
  rows, columns, filename,
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-2"
      disabled={rows.length === 0}
      onClick={() => exportToCSV(
        rows,
        columns,
        filename,
      )}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
