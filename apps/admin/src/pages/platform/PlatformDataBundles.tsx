import {
  Building2,
  ChevronDown,
  ChevronRight,
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

type BundleCatalogItem = {
  id: string;
  code: string;
  name: string;
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number | string;
  billing_cycle: "monthly" | "yearly";
  is_active: boolean;
};

function formatBundleSize(mb: number): string {
  if (mb >= 1024)
    return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}

/* ── Demo fallback catalog ── */
const DUMMY_CATALOG: BundleCatalogItem[] = [
  {
    id: "d1",
    code: "MTN_1GB_M",
    name: "MTN 1GB Monthly",
    carrier: "MTN",
    data_mb: 1024,
    validity_days: 30,
    price_ngn: 1500,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d2",
    code: "MTN_5GB_M",
    name: "MTN 5GB Monthly",
    carrier: "MTN",
    data_mb: 5120,
    validity_days: 30,
    price_ngn: 5500,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d3",
    code: "MTN_10GB_M",
    name: "MTN 10GB Monthly",
    carrier: "MTN",
    data_mb: 10240,
    validity_days: 30,
    price_ngn: 9500,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d4",
    code: "MTN_25GB_M",
    name: "MTN 25GB Monthly",
    carrier: "MTN",
    data_mb: 25600,
    validity_days: 30,
    price_ngn: 18000,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d5",
    code: "MTN_60GB_Y",
    name: "MTN 60GB Yearly",
    carrier: "MTN",
    data_mb: 61440,
    validity_days: 365,
    price_ngn: 75000,
    billing_cycle: "yearly",
    is_active: true,
  },
  {
    id: "d6",
    code: "AIRTEL_3GB_M",
    name: "Airtel 3GB Monthly",
    carrier: "Airtel",
    data_mb: 3072,
    validity_days: 30,
    price_ngn: 3500,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d7",
    code: "GLO_2GB_M",
    name: "Glo 2GB Monthly",
    carrier: "Glo",
    data_mb: 2048,
    validity_days: 30,
    price_ngn: 2200,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d8",
    code: "FONU_2GB_M",
    name: "Fonu 2GB Monthly",
    carrier: "Fonu",
    data_mb: 2048,
    validity_days: 30,
    price_ngn: 2000,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d9",
    code: "FONU_10GB_M",
    name: "Fonu 10GB Monthly",
    carrier: "Fonu",
    data_mb: 10240,
    validity_days: 30,
    price_ngn: 9000,
    billing_cycle: "monthly",
    is_active: true,
  },
  {
    id: "d10",
    code: "FONU_50GB_Y",
    name: "Fonu 50GB Yearly",
    carrier: "Fonu",
    data_mb: 51200,
    validity_days: 365,
    price_ngn: 65000,
    billing_cycle: "yearly",
    is_active: true,
  },
];

/* ── Per-SIM adoption demo data ──
   Each tenant has multiple SIMs; each SIM has its own MSISDN/ICCID
   and may carry one or more active subscription / top-up bundles. */
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

const DUMMY_TENANT_USAGE: TenantAdoption[] = [
  {
    tenant: "Lagos Express Logistics",
    sims: [
      {
        msisdn: "+2348031000111",
        iccid: "8923401000000000111",
        carrier: "MTN",
        vehicle: "TRK-001",
        bundles: [
          {
            name: "MTN 10GB Monthly",
            type: "subscription",
            price_ngn: 9500,
            expires_in_days: 12,
          },
          {
            name: "MTN 1GB Top-up",
            type: "top-up",
            price_ngn: 1500,
            expires_in_days: 5,

          },
        ],
      },
      {
        msisdn: "+2348031000112",
        iccid: "8923401000000000112",
        carrier: "MTN",
        vehicle: "TRK-002",
        bundles: [
          {
            name: "MTN 25GB Monthly",
            type: "subscription",
            price_ngn: 18000,
            expires_in_days: 22,
          },
        ],
      },
      {
        msisdn: "+2348031000113",
        iccid: "8923401000000000113",
        carrier: "Fonu",
        vehicle: "TRK-003",
        bundles: [
          {
            name: "Fonu 10GB Monthly",
            type: "subscription",
            price_ngn: 9000,
            expires_in_days: 8,
          },
        ],
      },
      {
        msisdn: "+2348031000114",
        iccid: "8923401000000000114",
        carrier: "Airtel",
        vehicle: "TRK-004",
        bundles: [
          {
            name: "Airtel 3GB Monthly",
            type: "subscription",
            price_ngn: 3500,
            expires_in_days: 17,
          },
          {
            name: "Airtel 500MB Top-up",
            type: "top-up",
            price_ngn: 800,
            expires_in_days: 3,
          },
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
        carrier: "MTN",
        vehicle: "NH-101",
        bundles: [
          {
            name: "MTN 5GB Monthly",
            type: "subscription",
            price_ngn: 5500,
            expires_in_days: 14,
          },
        ],
      },
      {
        msisdn: "+2348091200202",
        iccid: "8923401000000000202",
        carrier: "MTN",
        vehicle: "NH-102",
        bundles: [
          {
            name: "MTN 5GB Monthly",
            type: "subscription",
            price_ngn: 5500,
            expires_in_days: 9,
          },
        ],
      },
      {
        msisdn: "+2348091200203",
        iccid: "8923401000000000203",
        carrier: "Glo",
        vehicle: "NH-103",
        bundles: [
          {
            name: "Glo 2GB Monthly",
            type: "subscription",
            price_ngn: 2200,
            expires_in_days: 25,
          },
        ],
      },
    ],
  },
  {
    tenant: "Trans-Sahara Freight",
    sims: [
      {
        msisdn: "+2348051300301",
        iccid: "8923401000000000301",
        carrier: "Fonu",
        vehicle: "TS-001",
        bundles: [
          {
            name: "Fonu 50GB Yearly",
            type: "subscription",
            price_ngn: 65000,
            expires_in_days: 220,
          },
          {
            name: "Fonu 2GB Top-up",
            type: "top-up",
            price_ngn: 2000,
            expires_in_days: 6,

          },
        ],
      },
      {
        msisdn: "+2348051300302",
        iccid: "8923401000000000302",
        carrier: "MTN",
        vehicle: "TS-002",
        bundles: [
          {
            name: "MTN 10GB Monthly",
            type: "subscription",
            price_ngn: 9500,
            expires_in_days: 19,
          },
        ],
      },
    ],
  },
  {
    tenant: "Niger Delta Movers",
    sims: [
      {
        msisdn: "+2348071400401",
        iccid: "8923401000000000401",
        carrier: "Airtel",
        vehicle: "ND-77",
        bundles: [
          {
            name: "Airtel 3GB Monthly",
            type: "subscription",
            price_ngn: 3500,
            expires_in_days: 11,
          },
        ],
      },
    ],
  },
  {
    tenant: "Abuja Cargo Wings",
    sims: [
      {
        msisdn: "+2348061500501",
        iccid: "8923401000000000501",
        carrier: "MTN",
        vehicle: "AC-12",
        bundles: [
          {
            name: "MTN 25GB Monthly",
            type: "subscription",
            price_ngn: 18000,
            expires_in_days: 4,
          },
        ],
      },
      {
        msisdn: "+2348061500502",
        iccid: "8923401000000000502",
        carrier: "MTN",
        vehicle: "AC-13",
        bundles: [
          {
            name: "MTN 60GB Yearly",
            type: "subscription",
            price_ngn: 75000,
            expires_in_days: 300,
          },
        ],
      },
    ],
  },
];

const CARRIER_OPTIONS = [
  "MTN",
  "Airtel",
  "Glo",
  "9mobile",
  "Fonu",
];

type BundleFormState = {
  id?: string;
  code: string;
  name: string;
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
  carrier: "MTN",
  data_mb: 1024,
  validity_days: 30,
  price_ngn: 1500,
  billing_cycle: "monthly",
  is_active: true,
};

export default function PlatformDataBundles() {
  const { format: fmtCurrency } = useCurrency();
  const catalogLive: BundleCatalogItem[] = [];
  const upsert = {
    mutateAsync: async (_data: any) => {},
    isPending: false,
  };
  const toggle = { mutateAsync: async (_data: any) => {} };

  const catalog = (catalogLive.length > 0 ? catalogLive : DUMMY_CATALOG) as BundleCatalogItem[];

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
  const totalSimsAcrossTenants = DUMMY_TENANT_USAGE.reduce(
    (s, t) => s + t.sims.length,
    0,
  );
  const totalMonthlySpend = DUMMY_TENANT_USAGE.reduce(
    (s, t) => s + t.sims.reduce(
      (ss, sim) => ss + sim.bundles.reduce(
        (b, x) => b + x.price_ngn,
        0,
      ),
      0,
    ),
    0,
  );

  const openEdit = (b: BundleCatalogItem) => {
    setForm({
      id: b.id,
      code: b.code,
      name: b.name,
      carrier: b.carrier,
      data_mb: b.data_mb,
      validity_days: b.validity_days,
      price_ngn: Number(b.price_ngn),
      billing_cycle: b.billing_cycle,
      is_active: b.is_active,
    });
    setEditing(true);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast.error("Code and name are required");
      return;
    }
    try {
      await upsert.mutateAsync({
        code: form.code,
        name: form.name,
        carrier: form.carrier,
        data_mb: Number(form.data_mb),
        validity_days: Number(form.validity_days),
        price_ngn: Number(form.price_ngn),
        billing_cycle: form.billing_cycle,
        is_active: form.is_active,
      });
      setFormOpen(false);
    }
    catch {
      // toast handled in hook
    }
  };

  const handleToggle = async (b: BundleCatalogItem) => {
    try {
      await toggle.mutateAsync({
        id: b.id,
        is_active: !b.is_active,
      });
      toast.success(`Bundle ${!b.is_active ? "activated" : "deactivated"}`);
    }
    catch (e) {
      toast.error((e as Error).message);
    }
  };

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
    <div className="space-y-6 p-6">
      {/* KPI strip */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <StatCard
          title="Total Active Bundles"
          value={totalActive}
          icon={Layers}
        />
        <StatCard
          title="Carriers"
          value={carrierCount}
          icon={Tag}
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

      {/* Top-level: Data Bundles vs Tenant Adoption */}
      <Tabs
        defaultValue="catalog"
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="catalog">Data Bundles</TabsTrigger>
          <TabsTrigger value="adoption">Tenant Adoption</TabsTrigger>
        </TabsList>

        {/* DATA BUNDLES */}
        <TabsContent
          value="catalog"
          className="space-y-4"
        >
          <div className="flex justify-end">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setForm(emptyForm);
                setEditing(false);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bundle
            </Button>
          </div>

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
                          <TableCell
                            colSpan={8}
                            className="text-center py-6 text-muted-foreground"
                          >
                            No bundles match your filters
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggle(b)}
                                title={b.is_active ? "Deactivate" : "Activate"}
                              >
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Select
                  value={form.carrier}
                  onValueChange={v => setForm(f => ({
                    ...f,
                    carrier: v,
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARRIER_OPTIONS.map(c => (
                      <SelectItem
                        key={c}
                        value={c}
                      >
                        {c}
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
              disabled={upsert.isPending}
            >
              {upsert.isPending ? "Saving..." : editing ? "Save Changes" : "Create Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────── Tenant Adoption (per-SIM) ─────────────── */

const ALL_CARRIERS = [
  "MTN",
  "Airtel",
  "Glo",
  "Fonu",
] as const;

function TenantAdoptionTable({ data }: { data: TenantAdoption[] }) {
  const { format: fmtCurrency } = useCurrency();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    openTenants,
    setOpenTenants,
  ] = useState<Record<string, boolean>>({});
  const [
    draftCarrier,
    setDraftCarrier,
  ] = useState<string>("all");
  const [
    draftBundleType,
    setDraftBundleType,
  ] = useState<"all" | "subscription" | "top-up">("all");
  const [
    carrierEnabled,
    setCarrierEnabled,
  ] = useState(false);
  const [
    typeEnabled,
    setTypeEnabled,
  ] = useState(false);
  const [
    appliedCarrier,
    setAppliedCarrier,
  ] = useState<string>("all");
  const [
    appliedType,
    setAppliedType,
  ] = useState<"all" | "subscription" | "top-up">("all");
  const [
    popOpen,
    setPopOpen,
  ] = useState(false);

  const toggle = (tenant: string) =>
    setOpenTenants(s => ({
      ...s,
      [tenant]: !s[tenant],
    }));

  const matchSim = (sim: TenantSim) => {
    if (carrierEnabled && appliedCarrier !== "all" && sim.carrier !== appliedCarrier)
      return false;
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
              || sim.carrier.toLowerCase().includes(q)
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
      carrierEnabled,
      typeEnabled,
      appliedCarrier,
      appliedType,
    ],
  );

  const tenantSpend = (t: TenantAdoption) =>
    t.sims.reduce(
      (s, sim) => s + sim.bundles.reduce(
        (b, x) => b + x.price_ngn,
        0,
      ),
      0,
    );

  const exportCsv = () => {
    const rows: string[][] = [
      [
        "Tenant",
        "Mobile Number",
        "ICCID",
        "Carrier",
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
            sim.carrier,
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
    setAppliedCarrier(draftCarrier);
    setAppliedType(draftBundleType);
    setPopOpen(false);
  };
  const clearFilters = () => {
    setDraftCarrier("all");
    setDraftBundleType("all");
    setCarrierEnabled(false);
    setTypeEnabled(false);
    setAppliedCarrier("all");
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
                        checked={carrierEnabled}
                        onCheckedChange={v => setCarrierEnabled(Boolean(v))}
                        id="f-carrier"
                      />
                      <Label
                        htmlFor="f-carrier"
                        className="text-sm"
                      >
                        Carrier
                      </Label>
                    </div>
                    <div className={`pl-6 ${carrierEnabled ? "" : "opacity-50 pointer-events-none"}`}>
                      <Select
                        value={draftCarrier}
                        onValueChange={setDraftCarrier}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {ALL_CARRIERS.map(c => (
                            <SelectItem
                              key={c}
                              value={c}
                            >
                              {c === "Fonu" ? "FONU" : c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                <TableHead>Carriers</TableHead>
                <TableHead className="text-right">Monthly Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No tenants match the current filters
                      </TableCell>
                    </TableRow>
                  )
                : filtered.map((t) => {
                    const totalBundles = t.sims.reduce(
                      (s, sim) => s + sim.bundles.length,
                      0,
                    );
                    const carriersUsed = Array.from(new Set(t.sims.map(s => s.carrier)));
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
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {carriersUsed.map(c => (
                                    <Badge
                                      key={c}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {c === "Fonu" ? "FONU" : c}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {fmtCurrency(tenantSpend(t))}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow>
                              <TableCell
                                colSpan={6}
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
                                        <TableHead>Carrier</TableHead>
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
                                          <TableCell>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {sim.carrier === "Fonu" ? "FONU" : sim.carrier}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-sm">{sim.vehicle ?? "—"}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-col gap-1">
                                              {sim.bundles.map((b, i) => (
                                                <div
                                                  key={i}
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
                                                    {" "}
                                                    · expires in
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
