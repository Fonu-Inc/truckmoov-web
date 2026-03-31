import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import StatusBadge from "@/shared/components/StatusBadge";
import type { ReportType } from "./ReportTypeSelect";

interface ReportRow {
  ref: string;
  driver: string;
  vehicle: string;
  status: string;
  duration: string;
  date: string;
}

const JOB_ROWS: ReportRow[] = [
  { ref: "TMV-1032", driver: "Chukwuemeka Obi", vehicle: "TMV-401", status: "completed", duration: "2h 14m", date: "2026-03-31" },
  { ref: "TMV-1031", driver: "Adebayo Rauf", vehicle: "TMV-118", status: "in_progress", duration: "—", date: "2026-03-31" },
  { ref: "TMV-1029", driver: "Fatima Usman", vehicle: "TMV-233", status: "completed", duration: "1h 48m", date: "2026-03-30" },
  { ref: "TMV-1027", driver: "Yusuf Lawal", vehicle: "TMV-509", status: "cancelled", duration: "—", date: "2026-03-30" },
  { ref: "TMV-1025", driver: "Ngozi Eze", vehicle: "TMV-772", status: "completed", duration: "3h 02m", date: "2026-03-29" },
  { ref: "TMV-1022", driver: "Bayo Adeleke", vehicle: "TMV-334", status: "completed", duration: "1h 33m", date: "2026-03-29" },
  { ref: "TMV-1019", driver: "Chukwuemeka Obi", vehicle: "TMV-401", status: "completed", duration: "2h 55m", date: "2026-03-28" },
  { ref: "TMV-1017", driver: "Adebayo Rauf", vehicle: "TMV-118", status: "completed", duration: "1h 12m", date: "2026-03-27" },
];

const FLEET_ROWS: ReportRow[] = [
  { ref: "TMV-401", driver: "Chukwuemeka Obi", vehicle: "Volvo FH16", status: "active", duration: "18.4 hrs", date: "2026-03-31" },
  { ref: "TMV-118", driver: "Adebayo Rauf", vehicle: "MAN TGX", status: "active", duration: "21.1 hrs", date: "2026-03-31" },
  { ref: "TMV-233", driver: "Fatima Usman", vehicle: "DAF XF", status: "active", duration: "14.8 hrs", date: "2026-03-31" },
  { ref: "TMV-334", driver: "Bayo Adeleke", vehicle: "Scania R", status: "maintenance", duration: "0 hrs", date: "2026-03-31" },
  { ref: "TMV-509", driver: "Yusuf Lawal", vehicle: "Mercedes Actros", status: "active", duration: "19.6 hrs", date: "2026-03-31" },
  { ref: "TMV-772", driver: "Ngozi Eze", vehicle: "Iveco Stralis", status: "inactive", duration: "2.2 hrs", date: "2026-03-31" },
];

const TABLE_DATA: Record<ReportType, ReportRow[]> = {
  job_performance: JOB_ROWS,
  fleet_utilization: FLEET_ROWS,
  driver_performance: JOB_ROWS,
  route_analysis: JOB_ROWS,
};

const COLUMN_HEADERS: Record<ReportType, { ref: string; fourth: string }> = {
  job_performance: { ref: "Job Ref", fourth: "Duration" },
  fleet_utilization: { ref: "Vehicle ID", fourth: "Active Time" },
  driver_performance: { ref: "Job Ref", fourth: "Duration" },
  route_analysis: { ref: "Job Ref", fourth: "Duration" },
};

interface ReportTableProps {
  reportType: ReportType;
}

export default function ReportTable({ reportType }: ReportTableProps) {
  const data = TABLE_DATA[reportType];
  const headers = COLUMN_HEADERS[reportType];

  const columns: ColumnDef<ReportRow>[] = [
    {
      accessorKey: "ref",
      header: headers.ref,
      cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.ref}</span>,
    },
    {
      accessorKey: "driver",
      header: "Driver",
    },
    {
      accessorKey: "vehicle",
      header: "Vehicle",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "duration",
      header: headers.fourth,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.date}</span>,
    },
  ];

  return <DataTable columns={columns} data={data} noResultStatement="No records found." />;
}
