import type {
  BundleAdoptionItem,
  BundleType,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getBundleAdoptionExportQueryOptions,
  getBundleAdoptionQueryOptions,
  getBundleCatalogExportQueryOptions,
  getBundleCatalogQueryOptions,
  getBundleSummaryQueryOptions,
  getDataBundleCarriersQueryOptions,
  useCreateSystemBundle,
  useUpdateSystemBundle,
} from "@truckmoov/api/auth";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Download,
  Layers,
  Pencil,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  PageActions, PageTitle,
} from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

type BundleCatalogItem = {
  id: string;
  code: string;
  name: string;
  /** Catalog carrier id (e.g. "carrier-mtn"); what create takes. */
  carrierId: string;
  /** Carrier name for display and filtering. */
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number;
  billing_cycle: string;
  is_active: boolean;
};

function formatBundleSize(mb: number): string {
  if (mb >= 1024)
    return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}

/* ── Per-SIM adoption ──
   Each tenant has multiple SIMs; each SIM has its own MSISDN/ICCID
   and may carry one or more active subscription / top-up bundles. */
type TenantSim = {
  msisdn: string;
  iccid: string;
  carrier: string;
  vehicle?: string;
  bundles: {
    name: string;
    type: "subscription" | "top-up";
    price_ngn: number;
    expires_in_days: number;
  }[];
};
type TenantAdoption = {
  tenant: string;
  /** What the tenant's live bundles cost per month. */
  monthlySpendNgn: number;
  sims: TenantSim[];
};

/** One tenant's live bundles grouped per mobile number, the shape the table renders. */
function toTenantAdoption(item: BundleAdoptionItem): TenantAdoption {
  const byNumber = new Map<string, TenantSim>();
  for (const line of item.lines) {
    if (line.status !== "active" || !line.kind)
      continue;
    const sim = byNumber.get(line.mobileNumber) ?? {
      msisdn: line.mobileNumber,
      iccid: line.iccid ?? "-",
      carrier: line.carrier ?? "",
      vehicle: line.vehicleLabel ?? undefined,
      bundles: [],
    };
    sim.bundles.push({
      name: line.bundleName ?? line.bundleId,
      type: line.kind === "top_up" ? "top-up" : "subscription",
      price_ngn: line.priceNgn ?? 0,
      expires_in_days: line.expiresInDays ?? 0,
    });
    byNumber.set(
      line.mobileNumber,
      sim,
    );
  }
  return {
    tenant: item.tenantName,
    monthlySpendNgn: item.monthlySpendNgn,
    sims: [...byNumber.values()],
  };
}

type BundleFormState = {
  id?: string;
  code: string;
  name: string;
  /** Carrier id from the carriers endpoint. */
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number;
  billing_cycle: "monthly" | "yearly";
  is_active: boolean;
};

// MTN-synced rows: the catalogue sync, not an admin, switches them on and off.
const isCarrierManaged = (id?: string) => Boolean(id?.startsWith("bundle-mtn-m2m-"));

const emptyForm: BundleFormState = {
  code: "",
  name: "",
  carrier: "",
  data_mb: 1024,
  validity_days: 30,
  price_ngn: 1500,
  billing_cycle: "monthly",
  is_active: true,
};

export default function PlatformDataBundles() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("catalog");
  const heading = activeTab === "adoption"
    ? {
        title: "Tenant Adoption", description: "Monitor how tenants adopt and utilise available M2M data bundles across the platform.",
      }
    : {
        title: "M2M Data Bundles", description: "Manage available M2M data bundles, configure bundle offerings, and monitor their availability across the platform.",
      };
  const { format: fmtCurrency } = useCurrency();
  const catalogQuery = useQuery(getBundleCatalogQueryOptions({
    params: {
      status: "all", page: 1, limit: 100,
    },
  }));
  const summaryQuery = useQuery(getBundleSummaryQueryOptions());
  const summary = summaryQuery.data?.data;
  const figure = (value: number | undefined) => summaryQuery.isError || value === undefined ? "-" : value;
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());
  const carrierList = useMemo(
    () => carriersQuery.data?.data.carriers ?? [],
    [carriersQuery.data],
  );
  const createBundle = useCreateSystemBundle();
  const updateBundle = useUpdateSystemBundle();

  // The platform's own catalogue, so a bundle that is switched off still shows here.
  const catalog = useMemo<BundleCatalogItem[]>(
    () => (catalogQuery.data?.data.items ?? []).map(bundle => ({
      id: bundle.id,
      code: bundle.code,
      name: bundle.name,
      carrierId: bundle.carrier,
      carrier: bundle.carrierName ?? bundle.carrier,
      data_mb: bundle.dataAmountGb * 1024,
      validity_days: bundle.validityDays,
      price_ngn: bundle.price,
      billing_cycle: bundle.billingCycle,
      is_active: bundle.active,
    })),
    [catalogQuery.data],
  );
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    carrierFilter,
    setCarrierFilter,
  ] = useState<string>("");
  const [
    carrierFilterEnabled,
    setCarrierFilterEnabled,
  ] = useState(false);
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<"all" | "active" | "inactive">("all");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);
  const [
    form,
    setForm,
  ] = useState<BundleFormState>(emptyForm);
  const [
    editing,
    setEditing,
  ] = useState(false);
  const [
    originalPrice,
    setOriginalPrice,
  ] = useState<number | null>(null);
  const [
    showErrors,
    setShowErrors,
  ] = useState(false);
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const fieldErrors = {
    data_mb: form.data_mb > 0 ? undefined : "Enter a data size above 0",
    validity_days: form.validity_days > 0 ? undefined : "Enter a validity above 0",
    price_ngn: form.price_ngn > 0 ? undefined : "Enter a price above 0",
  };

  const carriers = useMemo(
    () => Array.from(new Set(catalog.map(b => b.carrier))).sort(),
    [catalog],
  );

  const filtered = useMemo(
    () => {
      return catalog.filter((b) => {
        if (search && !`${b.name} ${b.code}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (carrierFilterEnabled && carrierFilter && b.carrier !== carrierFilter)
          return false;
        if (statusFilter === "active" && !b.is_active)
          return false;
        if (statusFilter === "inactive" && b.is_active)
          return false;
        return true;
      });
    },
    [
      catalog,
      search,
      carrierFilter,
      carrierFilterEnabled,
      statusFilter,
    ],
  );

  // Fleetflow's form has no carrier field and defaults new bundles to MTN Nigeria.
  const defaultCarrierId = (carrierList.find(c => /mtn/i.test(`${c.id} ${c.name}`)) ?? carrierList[0])?.id ?? "";

  const openEdit = (b: BundleCatalogItem) => {
    setForm({
      id: b.id,
      code: b.code,
      name: b.name,
      carrier: b.carrierId,
      data_mb: b.data_mb,
      validity_days: b.validity_days,
      price_ngn: b.price_ngn,
      billing_cycle: b.billing_cycle === "yearly" ? "yearly" : "monthly",
      is_active: b.is_active,
    });
    setOriginalPrice(b.price_ngn);
    setShowErrors(false);
    setEditing(true);
    setFormOpen(true);
  };

  const handleToggle = async (b: BundleCatalogItem) => {
    try {
      await updateBundle.mutateAsync({
        id: b.id,
        data: { active: !b.is_active },
      });
      toast.success(`Bundle ${!b.is_active ? "activated" : "deactivated"}`);
    }
    catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveBundle = async () => {
    const fields = {
      name: form.name,
      dataAmountGb: Number(form.data_mb) / 1024,
      validityDays: Number(form.validity_days),
      billingCycle: form.billing_cycle,
      priceNaira: Number(form.price_ngn),
    };
    try {
      if (editing && form.id) {
        await updateBundle.mutateAsync({
          id: form.id,
          data: {
            ...fields, active: form.is_active,
          },
        });
      }
      else {
        // ponytail: id follows the "carrier-mtn" slug convention; confirm the format with the backend.
        const id = `bundle-${form.code.toLowerCase()}`;
        await createBundle.mutateAsync({
          data: {
            ...fields, id, code: form.code, carrierId: form.carrier, active: form.is_active,
          },
        });
      }
      toast.success(editing ? "Bundle updated" : "Bundle created");
      setFormOpen(false);
    }
    catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      toast.error("Code and name are required");
      return;
    }
    setShowErrors(true);
    if (Object.values(fieldErrors).some(Boolean))
      return;
    if (editing && originalPrice !== null && originalPrice !== form.price_ngn) {
      confirm({
        title: "Change bundle price?",
        description: `${fmtCurrency(originalPrice)} → ${fmtCurrency(form.price_ngn)}`,
        confirmLabel: "Change price",
        destructive: false,
        onConfirm: saveBundle,
      });
      return;
    }
    void saveBundle();
  };

  const isSaving = createBundle.isPending || updateBundle.isPending;

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const carrierId = carrierFilterEnabled && carrierFilter
        ? catalog.find(b => b.carrier === carrierFilter)?.carrierId
        : undefined;
      downloadBlob(
        await queryClient.fetchQuery(getBundleCatalogExportQueryOptions({
          params: {
            search: search || undefined, carrierId, status: statusFilter,
          },
        })),
        "bundle-catalog.csv",
      );
      toast.success("Bundles exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top-level: Data Bundles vs Tenant Adoption */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex w-fit mx-auto h-auto max-w-full flex-wrap gap-1">
          <TabsTrigger value="catalog">Data Bundles</TabsTrigger>
          <TabsTrigger value="adoption">Tenant Adoption</TabsTrigger>
        </TabsList>
        <PageTitle {...heading} />

        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Active Bundles"
            value={figure(summary?.totalActiveBundles)}
            icon={Layers}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Expiring in 7 Days"
            value={figure(summary?.expiringIn7Days)}
            icon={Clock}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="SIMs Across Tenants"
            value={figure(summary?.simsAcrossTenants)}
            icon={Building2}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Monthly Bundle Spend"
            value={summary ? fmtCurrency(summary.monthlyBundleSpendNgn) : "-"}
            icon={TrendingUp}
            loading={summaryQuery.isPending}
          />
        </div>

        {/* DATA BUNDLES */}
        <TabsContent
          value="catalog"
          className="space-y-4"
        >
          <PageActions>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setForm({
                  ...emptyForm, carrier: defaultCarrierId,
                });
                setOriginalPrice(null);
                setShowErrors(false);
                setEditing(false);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bundle
            </Button>
          </PageActions>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Bundles</CardTitle>
                  <CardDescription>
                    {filtered.length}
                    {" of "}
                    {catalog.length}
                    {" bundle(s)"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search bundles..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={carrierFilterEnabled && carrierFilter ? carrierFilter : "all"}
                  onValueChange={(v) => {
                    if (v === "all") {
                      setCarrierFilterEnabled(false);
                      setCarrierFilter("");
                    }
                    else {
                      setCarrierFilterEnabled(true);
                      setCarrierFilter(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Carriers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {carriers.map(c => (
                      <SelectItem
                        key={c}
                        value={c}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={v => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-6 text-muted-foreground"
                          >
                            {catalogQuery.isPending
                              ? "Loading bundles…"
                              : catalogQuery.isError
                                ? (
                                    <span
                                      role="alert"
                                      className="inline-flex items-center gap-3 text-destructive"
                                    >
                                      Unable to load the bundle catalog.
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void catalogQuery.refetch()}
                                      >
                                        Try again
                                      </Button>
                                    </span>
                                  )
                                : "No bundles found"}
                          </TableCell>
                        </TableRow>
                      )
                    : filtered.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            <div>{b.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{b.code}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{b.carrier}</Badge></TableCell>
                          <TableCell>{formatBundleSize(b.data_mb)}</TableCell>
                          <TableCell>
                            {b.validity_days}
                            d
                          </TableCell>
                          <TableCell><Badge variant="secondary">{b.billing_cycle}</Badge></TableCell>
                          <TableCell className="font-semibold">{fmtCurrency(Number(b.price_ngn))}</TableCell>
                          <TableCell>
                            <Badge variant={b.is_active ? "default" : "outline"}>
                              {b.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(b)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!isCarrierManaged(b.id) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => void handleToggle(b)}
                                  title={b.is_active ? "Deactivate" : "Activate"}
                                >
                                  <Power className={`h-4 w-4 ${b.is_active ? "text-success" : "text-muted-foreground"}`} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TENANT ADOPTION */}
        <TabsContent value="adoption">
          <TenantAdoptionTable />
        </TabsContent>
      </Tabs>

      {/* Create / Edit Bundle Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {editing ? "Edit Bundle" : "New Bundle"}
            </DialogTitle>
            <DialogDescription>
              Bundles defined here become available to every tenant for SIM allocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                value={form.billing_cycle}
                onValueChange={v => setForm(f => ({
                  ...f,
                  billing_cycle: v as "monthly" | "yearly",
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label required>Display Name</Label>
              <Input
                placeholder="e.g. MTN 10GB Monthly"
                value={form.name}
                onChange={e => setForm(f => ({
                  ...f,
                  name: e.target.value,
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label required>Bundle Code</Label>
              <Input
                placeholder="e.g. MTN_10GB_M"
                value={form.code}
                disabled={editing}
                onChange={e => setForm(f => ({
                  ...f,
                  code: e.target.value.toUpperCase(),
                }))}
              />
              <p className="text-xs text-muted-foreground">Unique identifier sent to the carrier PCRF. Cannot be changed after creation.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label required>Data (MB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.data_mb}
                  aria-invalid={showErrors && !!fieldErrors.data_mb}
                  onChange={e => setForm(f => ({
                    ...f,
                    data_mb: Number(e.target.value),
                  }))}
                />
                {showErrors && fieldErrors.data_mb && <p className="text-xs text-destructive">{fieldErrors.data_mb}</p>}
              </div>
              <div className="space-y-2">
                <Label required>Validity (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.validity_days}
                  aria-invalid={showErrors && !!fieldErrors.validity_days}
                  onChange={e => setForm(f => ({
                    ...f,
                    validity_days: Number(e.target.value),
                  }))}
                />
                {showErrors && fieldErrors.validity_days && <p className="text-xs text-destructive">{fieldErrors.validity_days}</p>}
              </div>
              <div className="space-y-2">
                <Label required>Price (NGN)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.price_ngn}
                  aria-invalid={showErrors && !!fieldErrors.price_ngn}
                  onChange={e => setForm(f => ({
                    ...f,
                    price_ngn: Number(e.target.value),
                  }))}
                />
                {showErrors && fieldErrors.price_ngn && <p className="text-xs text-destructive">{fieldErrors.price_ngn}</p>}
              </div>
            </div>

            {form.id && isCarrierManaged(form.id)
              ? (
                  <p className="rounded-md border p-3 text-xs text-muted-foreground">
                    MTN decides when this bundle is on sale. It follows the MTN catalogue sync.
                  </p>
                )
              : (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-xs text-muted-foreground">Inactive bundles are hidden from tenants.</p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={v => setForm(f => ({
                        ...f,
                        is_active: v,
                      }))}
                    />
                  </div>
                )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Create Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

/* ─────────────── Tenant Adoption (per-SIM) ─────────────── */

function TenantAdoptionTable() {
  const { format: fmtCurrency } = useCurrency();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    draftBundleType,
    setDraftBundleType,
  ] = useState<"all" | "subscription" | "top-up">("all");
  const [
    typeEnabled,
    setTypeEnabled,
  ] = useState(false);
  const [
    appliedType,
    setAppliedType,
  ] = useState<"all" | "subscription" | "top-up">("all");
  const [
    popOpen,
    setPopOpen,
  ] = useState(false);

  const [
    openTenants,
    setOpenTenants,
  ] = useState<Record<string, boolean>>({});
  const toggle = (tenant: string) =>
    setOpenTenants(s => ({
      ...s,
      [tenant]: !s[tenant],
    }));

  // The server searches and filters; the search waits for a pause in typing.
  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");
  useEffect(
    () => {
      const timer = setTimeout(
        () => setAppliedSearch(search.trim()),
        400,
      );
      return () => clearTimeout(timer);
    },
    [search],
  );
  const bundleType: BundleType | undefined = typeEnabled && appliedType !== "all"
    ? (appliedType === "top-up" ? "top_up" : "subscription")
    : undefined;
  const adoptionParams = {
    search: appliedSearch || undefined,
    bundleType,
  };
  const adoptionQuery = useQuery(getBundleAdoptionQueryOptions({ params: adoptionParams }));
  const filtered = useMemo(
    () => (adoptionQuery.data?.data.items ?? [])
      .map(toTenantAdoption)
      .filter(t => t.sims.length > 0),
    [adoptionQuery.data],
  );
  const hasFilters = !!adoptionParams.search || !!bundleType;

  const tenantSpend = (t: TenantAdoption) => t.monthlySpendNgn;

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      downloadBlob(
        await queryClient.fetchQuery(getBundleAdoptionExportQueryOptions({ params: adoptionParams })),
        "tenant-adoption.csv",
      );
      toast.success("Tenant adoption exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const applyFilters = () => {
    setAppliedType(draftBundleType);
    setPopOpen(false);
  };
  const clearFilters = () => {
    setDraftBundleType("all");
    setTypeEnabled(false);
    setAppliedType("all");
    setPopOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Adoption</CardTitle>
              <CardDescription>
                Each tenant's SIMs and the subscription / top-up bundles attached to each line.
                Expand a tenant to see every mobile number and the bundles riding on it.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {" "}
              Export Data
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search tenant, mobile number, ICCID, vehicle, bundle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Popover
              open={popOpen}
              onOpenChange={setPopOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {" "}
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80"
                align="end"
              >
                <div className="space-y-4">
                  <div className="font-medium text-sm">Show Tenants</div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={typeEnabled}
                        onCheckedChange={v => setTypeEnabled(Boolean(v))}
                        id="f-type"
                      />
                      <Label
                        htmlFor="f-type"
                        className="text-sm"
                      >
                        Bundle Type
                      </Label>
                    </div>
                    <div className={`pl-6 ${typeEnabled ? "" : "opacity-50 pointer-events-none"}`}>
                      <Select
                        value={draftBundleType}
                        onValueChange={v => setDraftBundleType(v as typeof draftBundleType)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                          <SelectItem value="top-up">Top-up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Show All
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={applyFilters}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36px]"></TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>SIMs</TableHead>
                <TableHead>Active Bundles</TableHead>
                <TableHead className="text-right">Monthly Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        {adoptionQuery.isPending
                          ? "Loading tenant adoption…"
                          : adoptionQuery.isError
                            ? "Couldn't load tenant adoption"
                            : hasFilters
                              ? "No tenants match the current filters"
                              : "No tenant has a bundle yet"}
                      </TableCell>
                    </TableRow>
                  )
                : filtered.map((t) => {
                    const totalBundles = t.sims.reduce(
                      (s, sim) => s + sim.bundles.length,
                      0,
                    );
                    const isOpen = !!openTenants[t.tenant];
                    return (
                      <Collapsible
                        key={t.tenant}
                        open={isOpen}
                        onOpenChange={() => toggle(t.tenant)}
                        asChild
                      >
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow className="cursor-pointer hover:bg-secondary/40">
                              <TableCell>
                                {isOpen
                                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              </TableCell>
                              <TableCell className="font-medium">{t.tenant}</TableCell>
                              <TableCell>{t.sims.length}</TableCell>
                              <TableCell>{totalBundles}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {fmtCurrency(tenantSpend(t))}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="bg-secondary/20 p-0"
                              >
                                <div className="p-4">
                                  <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">
                                    SIMs &amp; attached bundles
                                  </div>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Mobile Number</TableHead>
                                        <TableHead>ICCID</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Bundles</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {t.sims.map(sim => (
                                        <TableRow key={sim.iccid}>
                                          <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                              {sim.msisdn}
                                            </div>
                                          </TableCell>
                                          <TableCell className="font-mono text-xs text-muted-foreground">{sim.iccid}</TableCell>
                                          <TableCell className="text-sm">{sim.vehicle ?? "-"}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-col gap-1">
                                              {sim.bundles.map(b => (
                                                <div
                                                  key={`${b.type}-${b.name}`}
                                                  className="flex items-center gap-2 text-sm"
                                                >
                                                  <Badge
                                                    variant={b.type === "subscription" ? "default" : "secondary"}
                                                    className="text-[10px] uppercase"
                                                  >
                                                    {b.type}
                                                  </Badge>
                                                  <span className="font-medium">{b.name}</span>
                                                  <span className="text-muted-foreground text-xs">
                                                    {fmtCurrency(b.price_ngn)}
                                                    {" · expires in "}
                                                    {b.expires_in_days}
                                                    d
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
