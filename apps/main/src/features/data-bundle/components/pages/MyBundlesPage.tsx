import type { ColumnDef } from "@tanstack/react-table";
import type { DataBundleAllocationsQuery } from "@truckmoov/api/auth";
import type { DataBundlesLayoutContext } from "@/features/data-bundle/components/layout/DataBundlesLayout";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  exportDataBundleAllocations, getDataBundleAllocationsQueryOptions, getDataBundleCarriersQueryOptions, getSimsQueryOptions,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  Download, Eye, MoreHorizontal, Search, SlidersHorizontal, Smartphone, Wifi,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  formatBundleSize,
  formatMobile,
  useCarrierName,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

export function MyBundlesPage() {
  const {
    openTopUp, openViewAllocation,
  } = useOutletContext<DataBundlesLayoutContext>();
  // Allocations carry only the mobile number — carrier and fitted device come from the SIM list.
  const simsQuery = useQuery(getSimsQueryOptions({ params: { limit: 200 } }));
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());
  const carrierName = useCarrierName(carriersQuery.data?.data.carriers);
  const simByNumber = useMemo(
    () => new Map((simsQuery.data?.data?.items ?? []).map(sim => [
      formatMobile(sim.mobileNumber),
      sim,
    ])),
    [simsQuery.data],
  );

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    filterCycles,
    setFilterCycles,
  ] = useState<string[]>([]);
  const [
    draftCycles,
    setDraftCycles,
  ] = useState<string[]>([]);

  const debouncedAllocationSearch = useDebouncedValue(search.trim());
  const {
    page, pageSize, pagination,
  } = useServerPagination([
    debouncedAllocationSearch,
    statusFilter,
    filterCycles,
  ]);
  // Filters only — the export takes every matching row, not the visible page.
  const allocationQueryPayload = useMemo<DataBundleAllocationsQuery>(
    () => ({
      params: {
        search: debouncedAllocationSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        billingCycles: filterCycles.length > 0 ? filterCycles : undefined,
      },
    }),
    [
      debouncedAllocationSearch,
      statusFilter,
      filterCycles,
    ],
  );

  const allocationsQuery = useQuery({
    ...getDataBundleAllocationsQueryOptions({
      params: {
        ...allocationQueryPayload.params,
        page,
        limit: pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });
  const isLoading = allocationsQuery.isLoading;
  const allocations = useMemo(
    () => {
      return (allocationsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle?.code ?? "?",
        bundle: item.bundle,
        data_mb_total: item.dataTotalMb,
        data_mb_used: item.dataUsedMb,
        usage_percentage: item.usagePercentage,
        status: item.status,
        expires_at: item.expiresAt,
        created_at: item.activatedAt,
        days_left: item.daysLeft,
      }));
    },
    [allocationsQuery.data],
  );

  const filtered = allocations;

  const applyFilter = () => {
    setFilterCycles(draftCycles);
  };
  const clearFilter = () => {
    setDraftCycles([]);
    setFilterCycles([]);
  };

  const exportCsv = () => {
    exportDataBundleAllocations(allocationQueryPayload)
      .then(blob => downloadBlob(
        blob,
        `data-bundles-${Date.now()}.csv`,
      ))
      .catch((error: Error) => toast.error(error.message));
  };

  const allocationColumns: ColumnDef<(typeof filtered)[number]>[] = [
    {
      id: "sim",
      header: "SIM Card",
      cell: ({ row }) => {
        const a = row.original;
        const sim = simByNumber.get(formatMobile(a.msisdn));
        return (
          <>
            <p className="text-sm">{formatMobile(a.msisdn)}</p>
            <p className="text-xs text-muted-foreground">{sim?.operator ?? (a.bundle?.carrier ? carrierName(a.bundle.carrier) : "-")}</p>
          </>
        );
      },
    },
    {
      id: "device",
      header: "Device Assigned To",
      cell: ({ row }) => {
        const sim = simByNumber.get(formatMobile(row.original.msisdn));
        return (
          <>
            <p className="text-sm">{sim?.assignedDevice?.name || sim?.assignedDevice?.imei || "-"}</p>
            <p className="text-xs text-muted-foreground">{sim?.assignedDevice?.type}</p>
          </>
        );
      },
    },
    {
      accessorKey: "bundle_code",
      header: "Bundle",
    },
    {
      id: "usage",
      header: "Usage",
      meta: { className: "w-[200px]" },
      cell: ({ row }) => {
        const a = row.original;
        const pct = a.data_mb_total > 0 ? (a.data_mb_used / a.data_mb_total) * 100 : 0;
        return (
          <div className="space-y-1">
            <Progress
              value={pct}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {formatBundleSize(a.data_mb_used)}
              {" "}
              /
              {formatBundleSize(a.data_mb_total)}
            </p>
          </div>
        );
      },
    },
    {
      id: "expires",
      header: "Expires",
      cell: ({ row }) => {
        const a = row.original;
        const days = a.days_left ?? Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
        const isExpired = String(a.status).toUpperCase() === "EXPIRED" || days <= 0;
        return isExpired
          ? <Badge variant="destructive">Expired</Badge>
          : (
              <span className="text-sm">
                {days}
                d left
              </span>
            );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorFn: a => a.days_left <= 0 && String(a.status).toLowerCase() === "active" ? "EXPIRED" : String(a.status).toUpperCase(),
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return <Badge variant={status === "ACTIVE" ? "default" : status === "EXPIRED" ? "destructive" : "secondary"}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Allocation actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              openViewAllocation(row.original);
            }}
            >
              <Eye className="h-4 w-4 mr-2" />
              {" "}
              View allocation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openTopUp(row.original.msisdn)}>
              <Smartphone className="h-4 w-4 mr-2" />
              {" "}
              Top up bundle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                {" "}
                Active Allocations
              </CardTitle>
              <CardDescription>Active data bundles assigned to your SIMs, with consumption and expiry status to help you plan top-ups.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
            >
              <Download className="h-4 w-4 mr-2" />
              {" "}
              Export Data
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search mobile number or bundle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="h-10 rounded-xl px-3.5 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {" "}
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 rounded-xl space-y-3"
                align="end"
                sideOffset={8}
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show allocations by...</h4>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Billing cycle</p>
                  <div className="space-y-1.5 pl-0.5">
                    {[
                      {
                        v: "monthly", l: "Monthly",
                      },
                      {
                        v: "yearly", l: "Yearly",
                      },
                    ].map(opt => (
                      <label
                        key={opt.v}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={draftCycles.includes(opt.v)}
                          onCheckedChange={c => setDraftCycles(prev => c
                            ? [
                                ...prev,
                                opt.v,
                              ]
                            : prev.filter(x => x !== opt.v))}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={applyFilter}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={clearFilter}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <DataTable
            columns={allocationColumns}
            data={filtered}
            isLoading={isLoading}
            isError={allocationsQuery.isError}
            errorMessage={allocationsQuery.error?.message}
            onRetry={() => allocationsQuery.refetch()}
            emptyState="No bundles match your filters."
            pagination={pagination(allocationsQuery.data?.data.total ?? 0)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MyBundlesPage;
