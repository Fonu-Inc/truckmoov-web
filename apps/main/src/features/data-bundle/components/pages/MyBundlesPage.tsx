import type { DataBundleAllocationsQuery } from "@truckmoov/api/auth";
import type { DataBundlesLayoutContext } from "@/features/data-bundle/components/layout/DataBundlesLayout";
import { useQuery } from "@tanstack/react-query";
import { getDataBundleAllocationsQueryOptions } from "@truckmoov/api/auth";
import {
  Download, Eye, MoreHorizontal, Search, SlidersHorizontal, Smartphone, Wifi,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  downloadCsv,
  formatBundleSize,
  formatMobile,
  useDataBundleCatalog,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

export function MyBundlesPage() {
  const {
    openAllocateDialog, openViewAllocation,
  } = useOutletContext<DataBundlesLayoutContext>();
  const { catalog } = useDataBundleCatalog();

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    draftStatusFilter,
    setDraftStatusFilter,
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
  const allocationQueryPayload = useMemo<DataBundleAllocationsQuery>(
    () => ({
      params: {
        search: debouncedAllocationSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        billingCycles: filterCycles.length > 0 ? filterCycles : undefined,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedAllocationSearch,
      statusFilter,
      filterCycles,
    ],
  );

  const allocationsQuery = useQuery(getDataBundleAllocationsQueryOptions(allocationQueryPayload));
  const isLoading = allocationsQuery.isLoading;
  const allocations = useMemo(
    () => {
      return (allocationsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
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
    setStatusFilter(draftStatusFilter);
  };
  const clearFilter = () => {
    setDraftCycles([]);
    setFilterCycles([]);
    setDraftStatusFilter("all");
    setStatusFilter("all");
  };

  const exportCsv = () => {
    downloadCsv(
      `data-bundles-${Date.now()}.csv`,
      [
        "MSISDN",
        "Bundle",
        "Used (MB)",
        "Total (MB)",
        "Expires",
        "Status",
      ],
      filtered.map(a => [
        a.msisdn,
        a.bundle_code,
        a.data_mb_used,
        a.data_mb_total,
        new Date(a.expires_at).toISOString(),
        a.status,
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
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
                  <p className="text-xs font-medium">Status</p>
                  <Select
                    value={draftStatusFilter}
                    onValueChange={setDraftStatusFilter}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring">Expiring soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )
                : filtered.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No bundles match your filters.
                        </TableCell>
                      </TableRow>
                    )
                  : filtered.map((a) => {
                      const pct = a.data_mb_total > 0 ? (a.data_mb_used / a.data_mb_total) * 100 : 0;
                      const days = a.days_left ?? Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
                      const status = String(a.status).toUpperCase();
                      const isExpired = status === "EXPIRED" || days <= 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{formatMobile(a.msisdn)}</TableCell>
                          <TableCell>{a.bundle_code}</TableCell>
                          <TableCell className="w-[200px]">
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
                          </TableCell>
                          <TableCell>
                            {isExpired
                              ? <Badge variant="destructive">Expired</Badge>
                              : (
                                  <span className="text-sm">
                                    {days}
                                    d left
                                  </span>
                                )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  openViewAllocation(a);
                                }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {" "}
                                  View allocation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  const b = a.bundle ?? catalog.find(c => c.code === a.bundle_code);
                                  openAllocateDialog({
                                    carrier: b?.carrier ?? "",
                                    cycle: (b && ("billingCycle" in b ? b.billingCycle : b.billing_cycle)) ?? "",
                                    bundleCode: a.bundle_code,
                                    numbers: formatMobile(a.msisdn),
                                  });
                                }}
                                >
                                  <Smartphone className="h-4 w-4 mr-2" />
                                  {" "}
                                  Allocate bundle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyBundlesPage;
