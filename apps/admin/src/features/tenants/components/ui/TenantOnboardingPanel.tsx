import type { ColumnDef } from "@tanstack/react-table";
import type {
  OnboardingApplicantType,
  OnboardingApplicationStatus,
  SystemOnboardingApplicationRow,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationsQueryOptions,
  getSystemOnboardingApplicationsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import {
  formatDate, formatTime,
} from "@truckmoov/app-core/utils/time-utils";
import { useBatchedQuery } from "@truckmoov/reusables/hooks/useBatchedQuery";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  FileWarning,
  Hourglass,
  Mail,
  MoreHorizontal,
  PackageCheck,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
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
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useOnboardingApplicationActions } from "@/features/tenants/hooks/useOnboardingApplicationActions";
import {
  APPLICANT_TYPE_LABELS,
  canDecide,
  ONBOARDING_STATUS_COLORS,
  ONBOARDING_STATUS_DESCRIPTIONS,
  ONBOARDING_STATUS_LABELS,
  stageStatusColor,
} from "@/features/tenants/utils/onboarding";

export function TenantOnboardingPanel() {
  const navigate = useNavigate();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<OnboardingApplicationStatus | "all">("all");
  const [
    applicantType,
    setApplicantType,
  ] = useState<OnboardingApplicantType | "all">("all");

  useEffect(
    () => {
      const t = setTimeout(
        setDebouncedSearch,
        400,
        search.trim(),
      );
      return () => clearTimeout(t);
    },
    [search],
  );

  const summaryQuery = useQuery(getSystemOnboardingApplicationsSummaryQueryOptions());
  const summary = summaryQuery.data?.data;

  // The queue pages by `page`; batches are aligned to `limit`, so offset maps cleanly onto a page.
  const listQueryOptions = useCallback(
    ({
      offset, limit,
    }: {
      offset: number; limit: number;
    }) => getSystemOnboardingApplicationsQueryOptions({
      params: {
        search: debouncedSearch || undefined,
        status: status === "all" ? undefined : status,
        applicantType: applicantType === "all" ? undefined : applicantType,
        page: offset / limit + 1,
        limit,
      },
    }),
    [
      debouncedSearch,
      status,
      applicantType,
    ],
  );
  const {
    items, pagination, isLoading, isError, refetch, setPage,
  } = useBatchedQuery({
    queryOptions: listQueryOptions,
    // ponytail: the list's max limit isn't documented; 100 keeps batches under any sane cap.
    batchSize: 100,
  });

  useEffect(
    () => {
      setPage(1);
    },
    [
      debouncedSearch,
      status,
      applicantType,
      setPage,
    ],
  );

  const actions = useOnboardingApplicationActions();

  // Fixed layout so long names and badges wrap inside their column instead of
  // pushing the row wider; the table scrolls sideways below its min width.
  // Header labels break onto two lines the way the fleetflow table does.
  const wrap = "whitespace-normal";
  const columns: ColumnDef<SystemOnboardingApplicationRow>[] = [
    {
      id: "organization",
      header: "Tenant Name",
      meta: { className: `${wrap} w-[15%]` },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium break-words">{row.original.organizationName}</p>
          <p
            className="truncate text-xs text-muted-foreground"
            title={`${row.original.reference} · ${row.original.businessEmail}`}
          >
            {row.original.reference}
            {" · "}
            {row.original.businessEmail}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "contactFullName",
      header: "Contact Person",
      meta: { className: `${wrap} w-[11%]` },
      cell: ({ row }) => <span className="text-sm break-words">{row.original.contactFullName || "—"}</span>,
    },
    {
      id: "applicantType",
      header: "Tenant Type",
      meta: { className: `${wrap} w-[11%]` },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="h-auto max-w-full whitespace-normal break-words rounded-full text-left leading-tight"
        >
          {APPLICANT_TYPE_LABELS[row.original.applicantType]}
        </Badge>
      ),
    },
    {
      accessorKey: "vehicleCount",
      header: () => (
        <>
          Number of
          <br />
          Vehicles
        </>
      ),
      meta: { className: `${wrap} w-[8%]` },
    },
    {
      accessorKey: "deviceCount",
      header: () => (
        <>
          Devices
          <br />
          Requested
        </>
      ),
      meta: { className: `${wrap} w-[8%]` },
    },
    {
      id: "stageStatus",
      header: "Stage",
      meta: { className: `${wrap} w-[12%]` },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          title={row.original.stageStatus}
          className={`h-auto w-fit max-w-[150px] whitespace-normal rounded-full px-2.5 py-0.5 text-left leading-tight ${stageStatusColor(row.original.stageStatus)}`}
        >
          <span className="line-clamp-2">{row.original.stageStatus}</span>
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      meta: { className: `${wrap} w-[12%]` },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          title={ONBOARDING_STATUS_DESCRIPTIONS[row.original.status]}
          className={`h-auto w-fit max-w-[150px] whitespace-normal rounded-full px-2.5 py-0.5 text-left leading-tight ${ONBOARDING_STATUS_COLORS[row.original.status]}`}
        >
          <span className="line-clamp-2">{ONBOARDING_STATUS_LABELS[row.original.status]}</span>
        </Badge>
      ),
    },
    {
      id: "submittedAt",
      header: () => (
        <>
          Date
          <br />
          Submitted
        </>
      ),
      meta: { className: `${wrap} w-[9%]` },
      cell: ({ row }) => {
        const submitted = row.original.submittedAt ?? row.original.createdAt;
        return (
          <div className="text-sm text-muted-foreground">
            <span className="block whitespace-nowrap">{formatDate(submitted)}</span>
            <span className="block text-xs">{formatTime(submitted)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      meta: { className: "w-[14%] text-right" },
      cell: ({ row }) => {
        const app = row.original;
        const decidable = canDecide(app.status);
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => navigate(`/tenants/onboarding/${app.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Application
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Application actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/tenants/onboarding/${app.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {decidable && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-success"
                      disabled={actions.isPending}
                      onClick={() => actions.approve(app)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.openRequestChanges(app)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Request Changes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => actions.openReject(app)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {app.stage === "provisioning" && (
                  <DropdownMenuItem
                    disabled={actions.isPending}
                    onClick={() => actions.markProvisioned(app)}
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Mark provisioned
                  </DropdownMenuItem>
                )}
                {app.status === "approved" && (
                  <DropdownMenuItem
                    disabled={actions.isPending}
                    onClick={() => actions.resendSetupLink(app)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Resend setup link
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const hasActiveFilters = !!debouncedSearch || status !== "all" || applicantType !== "all";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          title="Total Applications"
          value={summary?.total ?? "—"}
          icon={ClipboardList}
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Pending Review"
          value={summary?.pendingReview ?? "—"}
          icon={Hourglass}
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Changes Requested"
          value={summary?.changesRequested ?? "—"}
          icon={FileWarning}
          variant="warning"
          loading={summaryQuery.isPending}
        />
        <StatCard
          title="Approved"
          value={summary?.approved ?? "—"}
          icon={CheckCircle2}
          variant="success"
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

      <Card className="bg-card/50 border-border/50 min-w-0 max-w-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Applications by Tenants</CardTitle>
              <CardDescription>
                Review submitted applications and approve tenants before allocating devices and SIMs.
              </CardDescription>
            </div>
            {/* ponytail: no export endpoint — exports the rows on the current page. */}
            <ExportButton
              rows={items}
              filename="tenant-onboarding"
              columns={[
                {
                  header: "Reference", accessor: r => r.reference,
                },
                {
                  header: "Organisation", accessor: r => r.organizationName,
                },
                {
                  header: "Email", accessor: r => r.businessEmail,
                },
                {
                  header: "Contact", accessor: r => r.contactFullName,
                },
                {
                  header: "Type", accessor: r => APPLICANT_TYPE_LABELS[r.applicantType],
                },
                {
                  header: "Vehicles", accessor: r => r.vehicleCount,
                },
                {
                  header: "Devices", accessor: r => r.deviceCount,
                },
                {
                  header: "Stage", accessor: r => r.stageStatus,
                },
                {
                  header: "Status", accessor: r => ONBOARDING_STATUS_LABELS[r.status],
                },
                {
                  header: "Submitted", accessor: r => r.submittedAt ?? "",
                },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by organisation, email, or reference..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={status}
              onValueChange={v => setStatus(v as OnboardingApplicationStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-[190px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(ONBOARDING_STATUS_LABELS) as OnboardingApplicationStatus[]).map(s => (
                  <SelectItem
                    key={s}
                    value={s}
                  >
                    {ONBOARDING_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={applicantType}
              onValueChange={v => setApplicantType(v as OnboardingApplicantType | "all")}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(APPLICANT_TYPE_LABELS) as OnboardingApplicantType[]).map(t => (
                  <SelectItem
                    key={t}
                    value={t}
                  >
                    {APPLICANT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="mb-2 text-xs text-muted-foreground xl:hidden">Scroll sideways to see all columns →</p>
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-border/60">
            <DataTable
              className="w-full min-w-[1440px] table-fixed [&_td]:box-border [&_th]:box-border [&_td]:align-top [&_td]:py-3 [&_th]:align-bottom [&_th]:py-3 [&_th]:leading-tight"
              columns={columns}
              data={items}
              isLoading={isLoading}
              isError={isError}
              errorMessage="Unable to load onboarding applications."
              onRetry={refetch}
              hasActiveFilters={hasActiveFilters}
              emptyState="No onboarding applications yet."
              filteredEmptyState="No applications match your filters."
              pagination={pagination}
            />
          </div>
        </CardContent>
      </Card>

      {actions.reasonDialog}
    </div>
  );
}
