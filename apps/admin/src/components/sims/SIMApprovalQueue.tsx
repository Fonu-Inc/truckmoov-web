import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  Search,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import {
  getSystemSimsRequestsQueryOptions,
  type SystemSimRequest,
  type SystemSimRequestsQuery,
} from "@truckmoov/api/auth";

import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
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

import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";

const emptyValue = "—";

const formatDataLimit = (valueMb: number) => {
  if (!Number.isFinite(valueMb) || valueMb <= 0) return emptyValue;
  if (valueMb >= 1024) {
    const gb = valueMb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${valueMb} MB`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyValue;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const normalizeText = (value: string | null | undefined) => value?.toLowerCase() ?? "";

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          Pending Review
        </Badge>
      );
    case "approved":
      return (
        <Badge className="border-info/30 bg-info/10 text-info">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status || emptyValue}</Badge>;
  }
};

const getKycBadge = (request: SystemSimRequest) => {
  const maybeKycStatus = (request as SystemSimRequest & { kycStatus?: string }).kycStatus;

  if (!maybeKycStatus) {
    return <span className="text-muted-foreground">{emptyValue}</span>;
  }

  return (
    <Badge className="border-success/30 bg-success/10 text-success">
      <ShieldCheck className="mr-1 h-3 w-3" />
      {maybeKycStatus}
    </Badge>
  );
};

const getRequestEmail = (request: SystemSimRequest) =>
  (request as SystemSimRequest & { requestEmail?: string }).requestEmail ?? emptyValue;

export function SIMApprovalQueue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryPayload = useMemo<SystemSimRequestsQuery | undefined>(() => {
    if (statusFilter === "all") return undefined;
    return {
      params: {
        status: statusFilter as "pending" | "approved" | "rejected",
      },
    };
  }, [statusFilter]);

  const requestsQuery = useQuery(getSystemSimsRequestsQueryOptions(queryPayload));
  const requests = requestsQuery.data?.data.requests ?? [];

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) =>
      [
        request.tenantName,
        getRequestEmail(request),
        request.preferredOperator,
        request.requestedPlan,
        request.useCase,
        request.status,
      ].some((value) => normalizeText(value).includes(query)),
    );
  }, [requests, searchQuery]);

  const summaryStats = useMemo(() => {
    return requests.reduce(
      (stats, request) => {
        stats.totalRequested += request.numberOfSims;

        switch (request.status.toLowerCase()) {
          case "pending":
            stats.pendingCount += 1;
            break;
          case "approved":
            stats.approvedCount += 1;
            break;
          case "rejected":
            stats.rejectedCount += 1;
            break;
        }

        return stats;
      },
      {
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        totalRequested: 0,
      },
    );
  }, [requests]);

  return (
    <div className="space-y-6">
      <SIMApprovalSummaryCards {...summaryStats} />

      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              SIM Requests
            </CardTitle>
            <CardDescription>
              Tenant submissions for new SIM provisioning awaiting review, approval, or fulfilment.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by organisation, email, carrier, use case..."
                className="pl-10"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px] px-6 whitespace-nowrap">Organisation</TableHead>
                  <TableHead className="min-w-[170px] px-6 whitespace-nowrap">Request Email</TableHead>
                  <TableHead className="min-w-[150px] px-6 whitespace-nowrap">Carrier</TableHead>
                  <TableHead className="min-w-[160px] px-6 whitespace-nowrap">Data Limit / SIM</TableHead>
                  <TableHead className="min-w-[120px] px-6 whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="min-w-[150px] px-6 whitespace-nowrap">KYC Status</TableHead>
                  <TableHead className="min-w-[160px] px-6 whitespace-nowrap">Status</TableHead>
                  <TableHead className="min-w-[170px] px-6 whitespace-nowrap">Date Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-12 text-center text-muted-foreground">
                        Loading SIM requests...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-12 text-center text-muted-foreground">
                        <Wifi className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No provisioning requests found</p>
                        <p className="text-sm">Adjust filters or wait for tenants to request SIM activations</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="px-6 font-semibold">{request.tenantName || emptyValue}</TableCell>
                      <TableCell className="px-6 text-muted-foreground">{getRequestEmail(request)}</TableCell>
                      <TableCell className="px-6 font-medium">{request.preferredOperator || emptyValue}</TableCell>
                      <TableCell className="px-6 font-semibold">
                        {formatDataLimit(request.requestedDataLimitMb)}
                      </TableCell>
                      <TableCell className="px-6 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          {request.numberOfSims}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">{getKycBadge(request)}</TableCell>
                      <TableCell className="px-6">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="px-6 text-muted-foreground">{formatDate(request.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
