import type { ColumnDef } from "@tanstack/react-table";
import type { SystemInstallationJob } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getSystemInstallationJobsQueryOptions } from "@truckmoov/api/auth";
import { useState } from "react";
import { DataTable } from "@/components/shadcn/data-table";
import { fromApiState } from "@/features/installers/installerOptions";
import { JobStatusBadge } from "./InstallerStatusBadge";

const PAGE_SIZE = 8;

function fmt(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
    : "—";
}

// Server-paged list: sorting one page would mislead, so every column opts out.
const JOB_COLUMNS: ColumnDef<SystemInstallationJob>[] = [
  {
    accessorKey: "jobNumber", header: "Job", enableSorting: false, meta: { className: "font-medium" },
  },
  {
    id: "customer", header: "Customer", enableSorting: false, cell: ({ row }) => row.original.customer || "—",
  },
  {
    id: "vehicle",
    header: "Vehicle",
    enableSorting: false,
    cell: ({ row: { original: job } }) => (
      <>
        {job.firstVehicle?.registrationNumber ?? "—"}
        {job.vehicleCount > 1 && ` +${job.vehicleCount - 1}`}
      </>
    ),
  },
  {
    id: "device",
    header: "Device",
    enableSorting: false,
    cell: ({ row: { original: job } }) => (
      <>
        {job.firstDevice ? `${job.firstDevice.manufacturer} ${job.firstDevice.model}` : "—"}
        {job.deviceCount > 1 && ` +${job.deviceCount - 1}`}
      </>
    ),
  },
  {
    id: "scheduled", header: "Scheduled", enableSorting: false, cell: ({ row }) => fmt(row.original.scheduledAt),
  },
  {
    id: "location",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) => `${row.original.location.city}, ${fromApiState(row.original.location.state)}`,
  },
  {
    id: "status", header: "Status", enableSorting: false, cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
  },
  {
    id: "completed", header: "Completed", enableSorting: false, cell: ({ row }) => fmt(row.original.completedAt),
  },
];

export function InstallerJobHistory({ installerId }: { installerId: string }) {
  const [
    page,
    setPage,
  ] = useState(1);
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(getSystemInstallationJobsQueryOptions({
    installerId,
    page,
    limit: PAGE_SIZE,
  }));

  const jobs = data?.data.items ?? [];
  const total = data?.data.total ?? 0;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable
        columns={JOB_COLUMNS}
        data={jobs}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        emptyState="No installation history for this installer."
        pagination={{
          page, pageSize: PAGE_SIZE, total, onPageChange: setPage,
        }}
      />
    </div>
  );
}
