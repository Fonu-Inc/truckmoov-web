import { useQuery } from "@tanstack/react-query";
import { getSystemInstallationJobsQueryOptions } from "@truckmoov/api/auth";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableSkeleton } from "@/components/ui/skeletons";
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
  const pages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableSkeleton
                rows={4}
                columns={8}
              />
            )}
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.jobNumber}</TableCell>
                <TableCell>{job.customer || "—"}</TableCell>
                <TableCell>
                  {job.firstVehicle?.registrationNumber ?? "—"}
                  {job.vehicleCount > 1 && ` +${job.vehicleCount - 1}`}
                </TableCell>
                <TableCell>
                  {job.firstDevice ? `${job.firstDevice.manufacturer} ${job.firstDevice.model}` : "—"}
                  {job.deviceCount > 1 && ` +${job.deviceCount - 1}`}
                </TableCell>
                <TableCell>{fmt(job.scheduledAt)}</TableCell>
                <TableCell>
                  {job.location.city}
                  ,
                  {" "}
                  {fromApiState(job.location.state)}
                </TableCell>
                <TableCell><JobStatusBadge status={job.status} /></TableCell>
                <TableCell>{fmt(job.completedAt)}</TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  {isError && (
                    <>
                      {error.message}
                      {" "}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => void refetch()}
                      >
                        Try again
                      </Button>
                    </>
                  )}
                  {!isError && "No installation history for this installer."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{`${total} jobs`}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span>{`Page ${page} of ${pages}`}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
