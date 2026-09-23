import type { InstallationJob } from "@/features/jobs/demoData";
import { Search } from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { JobStatusBadge } from "@/features/jobs/components/ui/JobStatusBadge";
import { installerName } from "@/features/jobs/demoData";
import {
  useJobsStore,
  useMyJobs,
} from "@/features/jobs/stores/jobsStore";
import { buildInstallationReportHtml } from "@/features/jobs/utils/installationReport";

function fmt(iso?: string) {
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

const CLOSED_STATUSES = [
  "completed",
  "unable_to_complete",
  "issue_reported",
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const installer = useJobsStore(s => s.installer);
  const myJobs = useMyJobs();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    from,
    setFrom,
  ] = useState("");
  const [
    to,
    setTo,
  ] = useState("");

  const rows = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      return myJobs
        .filter(j => CLOSED_STATUSES.includes(j.status))
        .filter(j => status === "all" || j.status === status)
        .filter(j => !from || j.scheduledDate >= from)
        .filter(j => !to || j.scheduledDate <= to)
        .filter(j =>
          !q
          || j.id.toLowerCase().includes(q)
          || j.customer.name.toLowerCase().includes(q)
          || j.customer.city.toLowerCase().includes(q)
          || j.customer.state.toLowerCase().includes(q)
          || j.vehicle.registration.toLowerCase().includes(q));
    },
    [
      myJobs,
      search,
      status,
      from,
      to,
    ],
  );

  const downloadReport = (job: InstallationJob) => {
    const blob = new Blob(
      [
        buildInstallationReportHtml(
          job,
          installerName(installer),
        ),
      ],
      { type: "text/html" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `installation-report-${job.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Past Installations
          <Badge
            variant="outline"
            className="text-[10px]"
          >
            Demo data
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, location, work order or vehicle"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="w-full sm:w-[190px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="issue_reported">Issue reported</SelectItem>
              <SelectItem value="unable_to_complete">Unable to complete</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full sm:w-[160px]"
          />
          <Input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full sm:w-[160px]"
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(j => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.id}</TableCell>
                  <TableCell>{j.customer.name}</TableCell>
                  <TableCell>{j.vehicle.registration}</TableCell>
                  <TableCell>
                    {j.device.manufacturer}
                    {" "}
                    {j.device.model}
                  </TableCell>
                  <TableCell>
                    {j.customer.city}
                    ,
                    {" "}
                    {j.customer.state}
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={j.status} />
                  </TableCell>
                  <TableCell>{fmt(j.completedAt)}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/jobs/${j.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(j)}
                    >
                      Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center"
                  >
                    <p className="text-sm font-medium">No past installations yet</p>
                    <p className="text-xs text-muted-foreground">
                      Completed jobs will be listed here.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
