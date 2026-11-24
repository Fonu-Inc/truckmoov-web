import type { ColumnDef } from "@tanstack/react-table";
import type { DataBundleRatesQuery } from "@truckmoov/api/auth";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  exportDataBundleRates,
  getDataBundleCarriersQueryOptions,
  getDataBundleRatesQueryOptions,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  Download, Search, SlidersHorizontal,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  formatBundleSize,
  formatNgn,
  useCarrierName,
  useDataBundleCatalog,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

export function CurrentRatesPage() {
  const { catalog } = useDataBundleCatalog();
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());

  const [
    ratesSearch,
    setRatesSearch,
  ] = useState("");
  const [
    ratesCarriers,
    setRatesCarriers,
  ] = useState<string[]>([]);
  const [
    ratesDraftCarriers,
    setRatesDraftCarriers,
  ] = useState<string[]>([]);
  const debouncedRatesSearch = useDebouncedValue(ratesSearch.trim());
  const {
    page, pageSize, pagination,
  } = useServerPagination([
    debouncedRatesSearch,
    ratesCarriers,
  ]);
  // Filters only — the export takes every matching row, not the visible page.
  const ratesQueryPayload = useMemo<DataBundleRatesQuery>(
    () => ({
      params: {
        search: debouncedRatesSearch || undefined,
        carriers: ratesCarriers.length > 0 ? ratesCarriers : undefined,
      },
    }),
    [
      debouncedRatesSearch,
      ratesCarriers,
    ],
  );

  const ratesQuery = useQuery({
    ...getDataBundleRatesQueryOptions({
      params: {
        ...ratesQueryPayload.params,
        page,
        limit: pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });
  const carrierName = useCarrierName(carriersQuery.data?.data.carriers);
  const ratesLive = useMemo(
    () => {
      return (ratesQuery.data?.data.items ?? []).map(rate => ({
        id: rate.id,
        code: rate.code,
        name: rate.name,
        carrierId: rate.carrier,
        carrier: carrierName(rate.carrier),
        data_mb: rate.dataAmountGb * 1024,
        validity_days: rate.validityDays,
        price_ngn: rate.price,
        billing_cycle: rate.billingCycle,
        is_active: rate.active,
      }));
    },
    [
      ratesQuery.data,
      carrierName,
    ],
  );
  const filteredRates = ratesQuery.data ? ratesLive : catalog.filter(b => b.is_active);

  const rateColumns: ColumnDef<(typeof filteredRates)[number]>[] = [
    {
      accessorKey: "name",
      header: "Bundle",
      meta: { className: "font-medium" },
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
    },
    {
      accessorKey: "data_mb",
      header: "Data",
      cell: ({ row }) => formatBundleSize(row.original.data_mb),
    },
    {
      accessorKey: "validity_days",
      header: "Validity",
      cell: ({ row }) => `${row.original.validity_days}d`,
    },
    {
      accessorKey: "billing_cycle",
      header: "Cycle",
      cell: ({ row }) => <Badge variant="secondary">{row.original.billing_cycle}</Badge>,
    },
    {
      id: "price",
      accessorFn: b => Number(b.price_ngn),
      header: "Price",
      meta: { className: "font-semibold" },
      cell: ({ row }) => formatNgn(Number(row.original.price_ngn)),
    },
  ];

  const dataBundleCarriers = useMemo(
    () => {
      const liveCarriers = carriersQuery.data?.data.carriers ?? [];
      if (liveCarriers.length > 0) {
        return liveCarriers.filter(carrier => carrier.active).map(carrier => ({
          value: carrier.id,
          label: carrier.displayName || carrier.name,
        }));
      }
      return Array.from(new Map(catalog.map(b => [
        b.carrierId,
        b.carrier,
      ]))).map(([
        value,
        label,
      ]) => ({
        value, label,
      }));
    },
    [
      carriersQuery.data,
      catalog,
    ],
  );

  const applyRatesFilter = () => {
    setRatesCarriers(ratesDraftCarriers);
  };
  const clearRatesFilter = () => {
    setRatesDraftCarriers([]);
    setRatesCarriers([]);
  };

  const exportRatesCsv = () => {
    exportDataBundleRates(ratesQueryPayload)
      .then(blob => downloadBlob(
        blob,
        `rates-${Date.now()}.csv`,
      ))
      .catch((error: Error) => toast.error(error.message));
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Rates</CardTitle>
              <CardDescription>Current bundle catalog by carrier and plan type, the source of truth for all SIM allocations.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportRatesCsv}
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
                placeholder="Search bundles..."
                value={ratesSearch}
                onChange={e => setRatesSearch(e.target.value)}
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
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show rates by...</h4>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Carrier</p>
                  <div className="space-y-1.5 pl-0.5">
                    {dataBundleCarriers.map(carrier => (
                      <label
                        key={carrier.value}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={ratesDraftCarriers.includes(carrier.value)}
                          onCheckedChange={chk => setRatesDraftCarriers(prev => chk
                            ? [
                                ...prev,
                                carrier.value,
                              ]
                            : prev.filter(x => x !== carrier.value))}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{carrier.label}</span>
                      </label>
                    ))}
                    {dataBundleCarriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={applyRatesFilter}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={clearRatesFilter}
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
            columns={rateColumns}
            data={filteredRates}
            isLoading={ratesQuery.isLoading}
            isError={ratesQuery.isError}
            errorMessage={ratesQuery.error?.message}
            onRetry={() => ratesQuery.refetch()}
            emptyState="No bundles match your filters"
            pagination={ratesQuery.data ? pagination(ratesQuery.data.data.total) : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default CurrentRatesPage;
