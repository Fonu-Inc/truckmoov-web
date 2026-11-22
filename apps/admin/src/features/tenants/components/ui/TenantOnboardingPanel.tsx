import type { FilterValues } from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationsQueryOptions,
  getSystemOnboardingApplicationsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  decisionLabel,
  DECISIONS,
  organizationTypeOf,
  toDecision,
} from "@/features/tenants/utils/onboarding";
import { inDateWindow } from "@/features/tenants/utils/tenants";

// ponytail: the list pages server-side and its max limit isn't documented. The reference
// renders every application in one unpaged table with client-side filters, so this loads
// the first 100 and filters those; a note shows when there are more.
const APPLICATIONS_LIMIT = 100;

/** Fleetflow's KYCReviewPanel — Tenants → Onboarding. Decisions happen on the application review page. */
export function TenantOnboardingPanel() {
  const navigate = useNavigate();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});

  const summaryQuery = useQuery(getSystemOnboardingApplicationsSummaryQueryOptions());
  const summary = summaryQuery.data?.data;
  const listQuery = useQuery(getSystemOnboardingApplicationsQueryOptions({
    params: {
      page: 1,
      limit: APPLICATIONS_LIMIT,
    },
  }));
  const applications = useMemo(
    () => listQuery.data?.data.items ?? [],
    [listQuery.data],
  );
  const total = listQuery.data?.data.total ?? applications.length;

  const filtered = useMemo(
    () => {
      const q = search.toLowerCase();
      const inRange = (value: number, filter?: FilterValues[string]) =>
        !filter?.enabled
        || ((!filter.from || value >= Number(filter.from)) && (!filter.to || value <= Number(filter.to)));
      return applications
        .map(application => ({
          application,
          decision: toDecision(application.status),
        }))
        .filter((record) => {
          const a = record.application;
          const matchesSearch
            = !q
              || a.organizationName.toLowerCase().includes(q)
              || a.businessEmail.toLowerCase().includes(q)
              || a.contactFullName.toLowerCase().includes(q);
          const organization = filters.organization;
          const date = filters.date;
          return (
            matchesSearch
            && (statusFilter === "all" || record.decision === statusFilter)
            && (!organization?.enabled || organizationTypeOf(a.applicantType) === organization.value)
            && (!date?.enabled || inDateWindow(
              a.submittedAt ?? a.createdAt,
              date.dateFrom,
              date.dateTo,
            ))
            && inRange(
              a.vehicleCount,
              filters.vehicles,
            )
            && inRange(
              a.deviceCount,
              filters.devices,
            )
          );
        });
    },
    [
      applications,
      filters,
      search,
      statusFilter,
    ],
  );

  const renderTable = (records: typeof filtered) => (
    <div className="min-w-0 max-w-full space-y-2">
      <p className="text-xs text-muted-foreground xl:hidden">Scroll sideways to see all columns →</p>
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-border/60">
        <Table className="w-full min-w-[1240px] table-fixed [&_td]:box-border [&_th]:box-border [&_td]:align-top [&_td]:py-3 [&_td>*]:min-w-0">
          <colgroup>
            <col style={{
              width: "17%", minWidth: 220,
            }}
            />
            <col style={{
              width: "13%", minWidth: 150,
            }}
            />
            <col style={{
              width: "13%", minWidth: 150,
            }}
            />
            <col style={{
              width: "9%", minWidth: 100,
            }}
            />
            <col style={{
              width: "9%", minWidth: 100,
            }}
            />
            <col style={{
              width: "16%", minWidth: 200,
            }}
            />
            <col style={{
              width: "10%", minWidth: 120,
            }}
            />
            <col style={{
              width: "13%", minWidth: 170,
            }}
            />
          </colgroup>
          <TableHeader>
            <TableRow className="[&>th]:align-bottom [&>th]:py-3 [&>th]:leading-tight [&>th]:whitespace-normal">
              <TableHead className="">Tenant Name</TableHead>
              <TableHead className="">Contact Person</TableHead>
              <TableHead className="">Tenant Type</TableHead>
              <TableHead className="">
                Number of
                <br />
                Vehicles
              </TableHead>
              <TableHead className="">
                Devices
                <br />
                Requested
              </TableHead>
              <TableHead className="">Status</TableHead>
              <TableHead className="">
                Date
                <br />
                Submitted
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading
              ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading applications…
                    </TableCell>
                  </TableRow>
                )
              : listQuery.isError
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Unable to load onboarding applications.
                        <Button
                          variant="link"
                          onClick={() => listQuery.refetch()}
                        >
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                : records.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No onboarding tenants found.
                        </TableCell>
                      </TableRow>
                    )
                  : (
                      records.map((record) => {
                        const a = record.application;
                        const submitted = a.submittedAt ?? a.createdAt;
                        return (
                          <TableRow key={a.id}>
                            <TableCell>
                              <p className="font-medium break-words">{a.organizationName}</p>
                              <p
                                className="truncate text-xs text-muted-foreground"
                                title={a.businessEmail}
                              >
                                {a.businessEmail}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm break-words">{a.contactFullName || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="h-auto max-w-full whitespace-normal break-words rounded-full text-left leading-tight"
                              >
                                {a.applicantType === "owner_operator" ? "Owner Operator / Individual" : "Enterprise"}
                              </Badge>
                            </TableCell>
                            <TableCell>{a.vehicleCount}</TableCell>
                            <TableCell>{a.deviceCount}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                title={decisionLabel(record.decision)}
                                className="h-auto w-fit max-w-[150px] whitespace-normal rounded-full px-2.5 py-0.5 text-left leading-tight"
                              >
                                <span className="line-clamp-2">{decisionLabel(record.decision)}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <span className="block whitespace-nowrap">
                                {formatWithPattern(
                                  submitted,
                                  "dd MMM yyyy",
                                )}
                              </span>
                              <span className="block text-xs">
                                {formatWithPattern(
                                  submitted,
                                  "HH:mm",
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => navigate(`/tenants/onboarding/${a.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Application
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
          </TableBody>
        </Table>
      </div>
      {total > applications.length && (
        <p className="text-xs text-muted-foreground">
          {`Showing the latest ${applications.length} of ${total} applications.`}
        </p>
      )}
    </div>
  );

  const exportData = () => {
    const rows = filtered.map(record => [
      record.application.organizationName,
      record.application.businessEmail,
      record.application.contactFullName,
      organizationTypeOf(record.application.applicantType),
      decisionLabel(record.decision),
      formatWithPattern(
        record.application.submittedAt ?? record.application.createdAt,
        "dd MMM yyyy, HH:mm",
      ),
    ]);
    const csv = [
      [
        "Organization Name",
        "Email",
        "Contact Person",
        "Tenant Type",
        "Status",
        "Date Submitted",
      ],
      ...rows,
    ].map(row => row.map(cell => `"${String(cell).replace(
      /"/g,
      "\"\"",
    )}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" },
    ));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tenant-onboarding.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Applications"
          value={summary?.total ?? "—"}
          icon={FileText}
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Pending Review"
          value={summary?.pendingReview ?? "—"}
          icon={Clock}
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Approved"
          value={summary?.approved ?? "—"}
          icon={CheckCircle}
          variant="success"
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="More Information Needed"
          value={summary?.changesRequested ?? "—"}
          icon={AlertTriangle}
          variant="warning"
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Rejected"
          value={summary?.rejected ?? "—"}
          icon={XCircle}
          variant="danger"
          loading={summaryQuery.isPending}
        />
      </div>
      <Card className="min-w-0 max-w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Applications by Tenants</CardTitle>
              <CardDescription>Review submitted applications and approve tenants before allocating devices and SIMs.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tenants…"
            status={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={DECISIONS.map(value => ({
              value,
              label: decisionLabel(value),
            }))}
            filterEntity="tenants"
            filterValues={filters}
            onFiltersApply={setFilters}
            filterFields={[
              {
                type: "select",
                key: "organization",
                label: "Organization Type",
                options: [
                  {
                    value: "Enterprise",
                    label: "Enterprise",
                  },
                  {
                    value: "Owner Operator",
                    label: "Owner Operator / Individual",
                  },
                ],
              },
              {
                type: "daterange",
                key: "date",
                label: "Date Applied",
              },
              {
                type: "range",
                key: "devices",
                label: "Device Quantity",
              },
              {
                type: "range",
                key: "vehicles",
                label: "Vehicle Quantity",
              },
            ]}
          />
        </CardHeader>
        <CardContent className="min-w-0">
          {renderTable(filtered)}
        </CardContent>
      </Card>
    </div>
  );
}
