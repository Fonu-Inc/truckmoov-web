import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleCarriersQueryOptions,
  getDataBundleRatesQueryOptions,
  useCreateSystemBundle,
  useUpdateSystemBundle,
} from "@truckmoov/api/auth";
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

/* ── Per-SIM adoption demo data ──
   Each tenant has multiple SIMs; each SIM has its own MSISDN/ICCID
   and may carry one or more active subscription / top-up bundles. */
type TenantSim = {
  msisdn: string;
  iccid: string;
  carrier: "MTN Nigeria";
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

// ponytail: mock data from fleetflow parity port — wire to packages/api
// No tenant-adoption endpoint yet; fleetflow's demo tenants feed the Tenant
// Adoption tab and the three adoption KPIs.
const DUMMY_TENANT_USAGE: TenantAdoption[] = [
  {
    tenant: "Lagos Express Logistics",
    sims: [
      {
        msisdn: "+2348031000111",
        iccid: "8923401000000000111",
        carrier: "MTN Nigeria",
        vehicle: "TRK-001",
        bundles: [
          { name: "MTN 10GB Monthly", type: "subscription", price_ngn: 9500, expires_in_days: 12 },
          { name: "MTN 1GB Top-up", type: "top-up", price_ngn: 1500, expires_in_days: 5 },
        ],
      },
      {
        msisdn: "+2348031000112",
        iccid: "8923401000000000112",
        carrier: "MTN Nigeria",
        vehicle: "TRK-002",
        bundles: [{ name: "MTN 25GB Monthly", type: "subscription", price_ngn: 18000, expires_in_days: 22 }],
      },
      {
        msisdn: "+2348031000113",
        iccid: "8923401000000000113",
        carrier: "MTN Nigeria",
        vehicle: "TRK-003",
        bundles: [{ name: "MTN 10GB Monthly", type: "subscription", price_ngn: 9000, expires_in_days: 8 }],
      },
      {
        msisdn: "+2348031000114",
        iccid: "8923401000000000114",
        carrier: "MTN Nigeria",
        vehicle: "TRK-004",
        bundles: [
          { name: "MTN 3GB Monthly", type: "subscription", price_ngn: 3500, expires_in_days: 17 },
          { name: "MTN 500MB Top-up", type: "top-up", price_ngn: 800, expires_in_days: 3 },
        ],
      },
    ],
  },
  {
    tenant: "Northern Haulage Co.",
    sims: [
      {
        msisdn: "+2348091200201",
        iccid: "8923401000000000201",
        carrier: "MTN Nigeria",
        vehicle: "NH-101",
        bundles: [{ name: "MTN 5GB Monthly", type: "subscription", price_ngn: 5500, expires_in_days: 14 }],
      },
      {
        msisdn: "+2348091200202",
        iccid: "8923401000000000202",
        carrier: "MTN Nigeria",
        vehicle: "NH-102",
        bundles: [{ name: "MTN 5GB Monthly", type: "subscription", price_ngn: 5500, expires_in_days: 9 }],
      },
      {
        msisdn: "+2348091200203",
        iccid: "8923401000000000203",
        carrier: "MTN Nigeria",
        vehicle: "NH-103",
        bundles: [{ name: "MTN 2GB Monthly", type: "subscription", price_ngn: 2200, expires_in_days: 25 }],
      },
    ],
  },
  {
    tenant: "Trans-Sahara Freight",
    sims: [
      {
        msisdn: "+2348051300301",
        iccid: "8923401000000000301",
        carrier: "MTN Nigeria",
        vehicle: "TS-001",
        bundles: [
          { name: "MTN 50GB Yearly", type: "subscription", price_ngn: 65000, expires_in_days: 220 },
          { name: "MTN 2GB Top-up", type: "top-up", price_ngn: 2000, expires_in_days: 6 },
        ],
      },
      {
        msisdn: "+2348051300302",
        iccid: "8923401000000000302",
        carrier: "MTN Nigeria",
        vehicle: "TS-002",
        bundles: [{ name: "MTN 10GB Monthly", type: "subscription", price_ngn: 9500, expires_in_days: 19 }],
      },
    ],
  },
  {
    tenant: "Niger Delta Movers",
    sims: [
      {
        msisdn: "+2348071400401",
        iccid: "8923401000000000401",
        carrier: "MTN Nigeria",
        vehicle: "ND-77",
        bundles: [{ name: "MTN 3GB Monthly", type: "subscription", price_ngn: 3500, expires_in_days: 11 }],
      },
    ],
  },
  {
    tenant: "Abuja Cargo Wings",
    sims: [
      {
        msisdn: "+2348061500501",
        iccid: "8923401000000000501",
        carrier: "MTN Nigeria",
        vehicle: "AC-12",
        bundles: [{ name: "MTN 25GB Monthly", type: "subscription", price_ngn: 18000, expires_in_days: 4 }],
      },
      {
        msisdn: "+2348061500502",
        iccid: "8923401000000000502",
        carrier: "MTN Nigeria",
        vehicle: "AC-13",
        bundles: [{ name: "MTN 60GB Yearly", type: "subscription", price_ngn: 75000, expires_in_days: 300 }],
      },
    ],
  },
];

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
  const expiringSoon = DUMMY_TENANT_USAGE.reduce(
    (s, t) => s + t.sims.reduce((ss, sim) => ss + sim.bundles.filter(b => b.expires_in_days <= 7).length, 0),
    0,
  );
  const totalSimsAcrossTenants = DUMMY_TENANT_USAGE.reduce((s, t) => s + t.sims.length, 0);
  const totalMonthlySpend = DUMMY_TENANT_USAGE.reduce(
    (s, t) => s + t.sims.reduce((ss, sim) => ss + sim.bundles.reduce((b, x) => b + x.price_ngn, 0), 0),
    0,
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

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast.error("Code and name are required");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Active Bundles"
            value={catalogQuery.isError ? "—" : totalActive}
            icon={Layers}
            loading={catalogQuery.isPending}
          />
          <StatCard
            title="Expiring in 7 Days"
            value={expiringSoon}
            icon={Clock}
          />
          <StatCard
            title="SIMs Across Tenants"
            value={totalSimsAcrossTenants}
            icon={Building2}
          />
          <StatCard
            title="Monthly Bundle Spend"
            value={fmtCurrency(totalMonthlySpend)}
            icon={TrendingUp}
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
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            {catalogQuery.isPending
                              ? "Loading bundles…"
                              : catalogQuery.isError
                                ? (
                                    <span role="alert" className="inline-flex items-center gap-3 text-destructive">
                                      Unable to load the bundle catalog.
                                      <Button variant="outline" size="sm" onClick={() => void catalogQuery.refetch()}>Try again</Button>
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
                              <Button variant="ghost" size="icon" onClick={() => openEdit(b)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => void handleToggle(b)} title={b.is_active ? "Deactivate" : "Activate"}>
                                <Power className={`h-4 w-4 ${b.is_active ? "text-success" : "text-muted-foreground"}`} />
                              </Button>
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
          <TenantAdoptionTable data={DUMMY_TENANT_USAGE} />
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

  const [
    openTenants,
    setOpenTenants,
  ] = useState<Record<string, boolean>>({});
  const toggle = (tenant: string) =>
    setOpenTenants(s => ({
      ...s,
      [tenant]: !s[tenant],
    }));

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

  const tenantSpend = (t: TenantAdoption) =>
    t.sims.reduce((s, sim) => s + sim.bundles.reduce((b, x) => b + x.price_ngn, 0), 0);

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
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No tenants match the current filters
                      </TableCell>
                    </TableRow>
                  )
                : filtered.map((t) => {
                    const totalBundles = t.sims.reduce((s, sim) => s + sim.bundles.length, 0);
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
                              <TableCell colSpan={5} className="bg-secondary/20 p-0">
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
                                          <TableCell className="text-sm">{sim.vehicle ?? "—"}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-col gap-1">
                                              {sim.bundles.map(b => (
                                                <div key={`${b.type}-${b.name}`} className="flex items-center gap-2 text-sm">
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
