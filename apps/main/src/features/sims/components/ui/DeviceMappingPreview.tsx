import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle, Cpu,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";

// Local type alias (hook deleted)
type DeviceMappingRow = {
  device_name: string;
  imei: string;
  serial_number?: string;
  notes?: string;
};

type DeviceMappingPreviewProps = { data: DeviceMappingRow[] };

const columns: ColumnDef<DeviceMappingRow>[] = [
  {
    accessorKey: "device_name",
    header: "Device Name",
    enableSorting: false,
    meta: { className: "font-medium py-2" },
  },
  {
    accessorKey: "imei",
    header: "IMEI",
    enableSorting: false,
    meta: { className: "font-mono py-2" },
  },
  {
    id: "serial",
    header: "Serial",
    enableSorting: false,
    meta: { className: "py-2" },
    cell: ({ row }) => row.original.serial_number || "-",
  },
  {
    id: "notes",
    header: "Notes",
    enableSorting: false,
    meta: { className: "text-muted-foreground py-2 max-w-[150px] truncate" },
    cell: ({ row }) => row.original.notes || "-",
  },
];

export function DeviceMappingPreview({ data }: DeviceMappingPreviewProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Device Mapping Preview
          <Badge
            variant="secondary"
            className="ml-auto"
          >
            {data.length}
            {" "}
            devices
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={data}
          className="text-xs"
        />
        <div className="px-4 py-2 bg-success/10 text-xs text-success flex items-center gap-1 border-t">
          <CheckCircle className="h-3 w-3" />
          All devices validated
        </div>
      </CardContent>
    </Card>
  );
}
