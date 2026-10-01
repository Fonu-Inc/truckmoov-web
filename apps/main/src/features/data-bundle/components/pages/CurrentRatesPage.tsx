import type { DataBundleRatesQuery } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  exportDataBundleRates,
  getDataBundleCarriersQueryOptions,
  getDataBundleRatesQueryOptions,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
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
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatBundleSize,
  useDataBundleCatalog,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

export function CurrentRatesPage() {
  const { format: fmtCurrency } = useCurrency();
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
  const ratesQueryPayload = useMemo<DataBundleRatesQuery>(
    () => ({
      params: {
        search: debouncedRatesSearch || undefined,
        carriers: ratesCarriers.length > 0 ? ratesCarriers : undefined,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedRatesSearch,
      ratesCarriers,
    ],
  );

  const ratesQuery = useQuery(getDataBundleRatesQueryOptions(ratesQueryPayload));
  const ratesLive = useMemo(
    () => {
      return (ratesQuery.data?.data.items ?? []).map(rate => ({
        id: rate.id,
        code: rate.code,
        name: rate.name,
        carrier: rate.carrier,
        data_mb: rate.dataAmountGb * 1024,
        validity_days: rate.validityDays,
        price_ngn: rate.price,
        billing_cycle: rate.billingCycle,
        is_active: rate.active,
      }));
    },
    [ratesQuery.data],
  );
  const filteredRates = ratesQuery.data ? ratesLive : catalog.filter(b => b.is_active);

  const dataBundleCarriers = useMemo(
    () => {
      const liveCarriers = carriersQuery.data?.data.carriers ?? [];
      if (liveCarriers.length > 0) {
        return liveCarriers.filter(carrier => carrier.active).map(carrier => ({
          value: carrier.name,
          label: carrier.displayName || carrier.name,
        }));
      }
      return Array.from(new Set(catalog.map(b => b.carrier))).map(carrier => ({
        value: carrier,
        label: carrier,
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
              <CardDescription>Current bundle catalog by carrier and plan type — the source of truth for all SIM allocations.</CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratesQuery.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6"
                  >
                    <p role="alert">{ratesQuery.error.message}</p>
                    <Button
                      variant="link"
                      onClick={() => ratesQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : ratesQuery.isLoading
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )
                : filteredRates.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No bundles match your filters
                        </TableCell>
                      </TableRow>
                    )
                  : filteredRates.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.carrier}</TableCell>
                        <TableCell>{formatBundleSize(b.data_mb)}</TableCell>
                        <TableCell>
                          {b.validity_days}
                          d
                        </TableCell>
                        <TableCell><Badge variant="secondary">{b.billing_cycle}</Badge></TableCell>
                        <TableCell className="font-semibold">{fmtCurrency(Number(b.price_ngn))}</TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default CurrentRatesPage;
