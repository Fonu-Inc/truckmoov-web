import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleCarriersQueryOptions,
  getDataBundleRatesQueryOptions,
  useCreateSystemBundle,
  useUpdateSystemBundle,
} from "@truckmoov/api/auth";
import {
  Building2,
  Database,
  Download,
  Layers,
  Pencil,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
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
import { DataTable } from "@/components/shadcn/data-table";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  PageActions, PageTitle,
} from "@/shared/components/layout/PageTitle";

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

/* ── Per-SIM tenant adoption ──
   Each tenant has multiple SIMs; each SIM has its own MSISDN/ICCID
   and may carry one or more active subscription / top-up bundles.
   ponytail: no backend endpoint yet, so the tab renders empty. */
type TenantSim = {
  msisdn: string;
  iccid: string;
  carrier: "MTN" | "Airtel" | "Glo" | "Fonu";
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
  sims: TenantSim[];
};

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
  const catalogQuery = useQuery(getDataBundleRatesQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());
  const carrierList = useMemo(
    () => carriersQuery.data?.data.carriers ?? [],
    [carriersQuery.data],
  );
  const createBundle = useCreateSystemBundle();
  const updateBundle = useUpdateSystemBundle();

  // ponytail: mirrors apps/main useDataBundleCatalog; move to packages/api if a third consumer appears.
  const catalog = useMemo<BundleCatalogItem[]>(
    () => {
      const nameById = new Map(carrierList.map(c => [
        c.id,
        c.displayName || c.name,
      ]));
      return (catalogQuery.data?.data.items ?? []).map(rate => ({
        id: rate.id,
        code: rate.code,
        name: rate.name,
        carrierId: rate.carrier,
        carrier: nameById.get(rate.carrier) ?? rate.carrier,
        data_mb: rate.dataAmountGb * 1024,
        validity_days: rate.validityDays,
        price_ngn: rate.price,
        billing_cycle: rate.billingCycle,
        is_active: rate.active,
      }));
    },
    [
      catalogQuery.data,
      carrierList,
    ],
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

  const totalActive = catalog.filter(b => b.is_active).length;
  const carrierCount = carriers.length;

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

  const catalogColumns: ColumnDef<BundleCatalogItem>[] = useMemo(
    () => [
      {
        id: "bundle",
        header: "Bundle",
        cell: ({ row }) => (
          <div className="font-medium">
            <div>{row.original.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{row.original.code}</div>
          </div>
        ),
      },
      {
        id: "carrier",
        header: "Carrier",
        cell: ({ row }) => <Badge variant="outline">{row.original.carrier}</Badge>,
      },
      {
        id: "data",
        header: "Data",
        cell: ({ row }) => formatBundleSize(row.original.data_mb),
      },
      {
        id: "validity",
        header: "Validity",
        cell: ({ row }) => `${row.original.validity_days}d`,
      },
      {
        id: "cycle",
        header: "Cycle",
        cell: ({ row }) => <Badge variant="secondary">{row.original.billing_cycle}</Badge>,
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) => <span className="font-semibold">{fmtCurrency(Number(row.original.price_ngn))}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "outline"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(b);
                }}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(b);
                }}
                title={b.is_active ? "Deactivate" : "Activate"}
              >
                <Power className={`h-4 w-4 ${b.is_active ? "text-success" : "text-muted-foreground"}`} />
              </Button>
            </div>
          );
        },
      },
    ],
    [fmtCurrency],
  );

  const handleSave = async () => {
    if (!form.code || !form.name || !form.carrier) {
      toast.error("Carrier, code and name are required");
      return;
    }
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
            ...fields, id, code: form.code, carrierId: form.carrier,
          },
        });
        // Create takes no active flag, so a bundle saved as inactive needs a follow-up update.
        if (!form.is_active) {
          await updateBundle.mutateAsync({
            id, data: { active: false },
          });
        }
      }
      toast.success(editing ? "Bundle updated" : "Bundle created");
      setFormOpen(false);
    }
    catch (e) {
      toast.error((e as Error).message);
    }
  };
  const isSaving = createBundle.isPending || updateBundle.isPending;

  const exportCsv = () => {
    const rows = [
      [
        "Code",
        "Name",
        "Carrier",
        "Data (MB)",
        "Validity (days)",
        "Cycle",
        "Price (NGN)",
        "Active",
      ],
      ...filtered.map(b => [
        b.code,
        b.name,
        b.carrier,
        String(b.data_mb),
        String(b.validity_days),
        b.billing_cycle,
        String(b.price_ngn),
        b.is_active ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bundle-catalog-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
          <StatCard
            title="Total Active Bundles"
            value={catalogQuery.isError ? "—" : totalActive}
            icon={Layers}
            loading={catalogQuery.isPending}
          />
          <StatCard
            title="Carriers"
            value={catalogQuery.isError ? "—" : carrierCount}
            icon={Tag}
            loading={catalogQuery.isPending}
          />
          <StatCard
            title="SIMs Across Tenants"
            value="—"
            icon={Building2}
            footer={<span className="text-xs text-muted-foreground">No data source yet</span>}
          />
          <StatCard
            title="Monthly Bundle Spend"
            value="—"
            icon={TrendingUp}
            footer={<span className="text-xs text-muted-foreground">No data source yet</span>}
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
                  ...emptyForm, carrier: carrierList[0]?.id ?? "",
                });
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
                  onClick={exportCsv}
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
              <DataTable
                columns={catalogColumns}
                data={filtered}
                hasActiveFilters={!!search || carrierFilterEnabled || statusFilter !== "all"}
                isLoading={catalogQuery.isPending}
                isError={catalogQuery.isError}
                errorMessage="Unable to load the bundle catalog."
                onRetry={() => void catalogQuery.refetch()}
                emptyState="No bundles in the catalog yet"
                filteredEmptyState="No bundles match your filters"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TENANT ADOPTION */}
        <TabsContent value="adoption">
          <TenantAdoptionTable data={[]} />
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Select
                  value={form.carrier}
                  disabled={editing}
                  onValueChange={v => setForm(f => ({
                    ...f,
                    carrier: v,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={carriersQuery.isPending ? "Loading…" : "Select carrier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {carrierList.map(c => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                      >
                        {c.displayName || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
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
              <Label>Bundle Code</Label>
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
                <Label>Data (MB)</Label>
                <Input
                  type="number"
                  value={form.data_mb}
                  onChange={e => setForm(f => ({
                    ...f,
                    data_mb: Number(e.target.value),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Validity (days)</Label>
                <Input
                  type="number"
                  value={form.validity_days}
                  onChange={e => setForm(f => ({
                    ...f,
                    validity_days: Number(e.target.value),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (NGN)</Label>
                <Input
                  type="number"
                  value={form.price_ngn}
                  onChange={e => setForm(f => ({
                    ...f,
                    price_ngn: Number(e.target.value),
                  }))}
                />
              </div>
            </div>

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
    </div>
  );
}

/* ─────────────── Tenant Adoption (per-SIM) ─────────────── */

type SimRow = TenantSim & { tenant: string };

function TenantAdoptionTable({ data }: { data: TenantAdoption[] }) {
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

  const matchSim = (sim: TenantSim) => {
    if (typeEnabled && appliedType !== "all" && !sim.bundles.some(b => b.type === appliedType))
      return false;
    return true;
  };

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      return data
        .map((t) => {
          const sims = t.sims.filter((sim) => {
            if (!matchSim(sim))
              return false;
            if (!q)
              return true;
            return (
              t.tenant.toLowerCase().includes(q)
              || sim.msisdn.toLowerCase().includes(q)
              || sim.iccid.toLowerCase().includes(q)
              || (sim.vehicle ?? "").toLowerCase().includes(q)
              || sim.bundles.some(b => b.name.toLowerCase().includes(q))
            );
          });
          return {
            ...t,
            sims,
          };
        })
        .filter(t => t.sims.length > 0);
    },
    [
      data,
      search,
      typeEnabled,
      appliedType,
    ],
  );

  const simSpend = (sim: TenantSim) =>
    sim.bundles.reduce(
      (b, x) => b + x.price_ngn,
      0,
    );

  // One row per SIM: DataTable has no expandable rows, so the tenant is a column.
  const simRows: SimRow[] = filtered.flatMap(t => t.sims.map(sim => ({
    ...sim,
    tenant: t.tenant,
  })));

  const adoptionColumns: ColumnDef<SimRow>[] = [
    {
      accessorKey: "tenant",
      header: "Tenant",
      meta: { className: "font-medium" },
    },
    {
      accessorKey: "msisdn",
      header: "Mobile Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-mono text-xs">
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.msisdn}
        </div>
      ),
    },
    {
      accessorKey: "iccid",
      header: "ICCID",
      meta: { className: "font-mono text-xs text-muted-foreground" },
    },
    {
      id: "vehicle",
      header: "Vehicle",
      accessorFn: sim => sim.vehicle ?? "—",
      meta: { className: "text-sm" },
    },
    {
      id: "bundles",
      header: "Bundles",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {row.original.bundles.map(b => (
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
      ),
    },
    {
      id: "spend",
      header: "Spend",
      accessorFn: simSpend,
      meta: { className: "text-right font-semibold" },
      cell: ({ row }) => fmtCurrency(simSpend(row.original)),
    },
  ];

  const exportCsv = () => {
    const rows: string[][] = [
      [
        "Tenant",
        "Mobile Number",
        "ICCID",
        "Vehicle",
        "Bundle",
        "Type",
        "Price (NGN)",
        "Expires (days)",
      ],
    ];
    filtered.forEach(t =>
      t.sims.forEach(sim =>
        sim.bundles.forEach(b =>
          rows.push([
            t.tenant,
            sim.msisdn,
            sim.iccid,
            sim.vehicle ?? "",
            b.name,
            b.type,
            String(b.price_ngn),
            String(b.expires_in_days),
          ]))));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenant-adoption-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              onClick={exportCsv}
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
          <DataTable
            columns={adoptionColumns}
            data={simRows}
            hasActiveFilters={data.length > 0}
            emptyState="Tenant adoption data isn't available yet"
            filteredEmptyState="No tenants match the current filters"
          />
        </CardContent>
      </Card>
    </div>
  );
}
