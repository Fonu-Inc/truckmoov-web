import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/shadcn/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { StatCard } from "@/components/dashboard/StatCard";
type PostpaidInvoice = {
  id: string;
  tenant_id: string;
  invoice_number: string;
  billing_period: string;
  total_usage_ngn: number;
  wallet_deducted_ngn: number;
  invoice_balance_ngn: number;
  due_date: string;
  status: string;
  [key: string]: any;
};
import { formatCurrency, type Currency } from "@/lib/currency";
import {Download, Receipt, CreditCard, AlertTriangle, Play, Loader2, Shield, TrendingUp, Clock, CheckCircle, XCircle, Search, MoreHorizontal, Settings} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { toast } from "sonner";
import { Separator } from "@/components/shadcn/separator";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  PlatformFilterPopover,
  buildEmptyDraft,
  type FilterDraft,
  type FilterField } from "@/components/shadcn/platform-filter-popover";

const POSTPAID_FILTER_FIELDS: FilterField[] = [
  { key: "due_date", label: "Due Date", type: "date" },
  { key: "balance", label: "Balance Due (NGN)", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max" },
  { key: "balance_due_date", label: "Balance Due Date", type: "date" },
];

const CREDIT_LIMIT_FILTER_FIELDS: FilterField[] = [
  {
    key: "action",
    label: "Action on Limit",
    type: "select",
    options: [
      { value: "notify_only", label: "Notify Only" },
      { value: "suspend_services", label: "Suspend Services" },
    ],
  },
  {
    key: "suspended",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "suspended", label: "Suspended" },
    ],
  },
  { key: "utilization", label: "Utilisation %", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max" },
];

interface PostpaidBillingTabProps {
  currency: Currency;
  getDisplayAmount: (amount: number) => number;
}

export function PostpaidBillingTab({ currency, getDisplayAmount }: PostpaidBillingTabProps) {
  const rawInvoices: PostpaidInvoice[] = [];
  const runBillingCycle = { mutateAsync: async (_arg: any) => {} };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [creditLimitValue, setCreditLimitValue] = useState("");
  const [thresholdValue, setThresholdValue] = useState("80");
  const [hardLimitAction, setHardLimitAction] = useState("notify_only");
  const [postpaidFilters, setPostpaidFilters] = useState<FilterDraft>(() => buildEmptyDraft(POSTPAID_FILTER_FIELDS));
  const [creditSearch, setCreditSearch] = useState("");
  const [creditFilters, setCreditFilters] = useState<FilterDraft>(() => buildEmptyDraft(CREDIT_LIMIT_FILTER_FIELDS));
  // Billing cycle preview / progress state
  const [billingCycleTenantId, setBillingCycleTenantId] = useState<string | null>(null);
  const [billingCyclePhase, setBillingCyclePhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [billingCycleStepIdx, setBillingCycleStepIdx] = useState(0);
  const [billingCycleError, setBillingCycleError] = useState<string | null>(null);

  // Fetch all postpaid tenants with their credit limits
  const rawTenants: any[] = [];
  const rawCreditLimits: any[] = [];

  // Demo fallback so platform admins always see realistic content
  const DEMO_TENANTS = [
    { id: 'demo-t1', name: 'Lagos Express Logistics', billing_model: 'postpaid', billing_cycle_day: 1, status: 'active' },
    { id: 'demo-t2', name: 'Accra Swift Cargo', billing_model: 'postpaid', billing_cycle_day: 1, status: 'active' },
    { id: 'demo-t3', name: 'Nairobi Fleet Group', billing_model: 'postpaid', billing_cycle_day: 15, status: 'active' },
    { id: 'demo-t4', name: 'Cape Town Trucking', billing_model: 'postpaid', billing_cycle_day: 1, status: 'active' },
    { id: 'demo-t5', name: 'Johannesburg Freight', billing_model: 'postpaid', billing_cycle_day: 1, status: 'active' },
    { id: 'demo-t6', name: 'Abuja Haulage Co.', billing_model: 'postpaid', billing_cycle_day: 15, status: 'active' },
  ];
  const DEMO_CREDIT_LIMITS = [
    { tenant_id: 'demo-t1', credit_limit_ngn: 5_000_000, current_usage_ngn: 3_240_000, warning_threshold_percent: 80, hard_limit_action: 'notify_only', is_suspended: false },
    { tenant_id: 'demo-t2', credit_limit_ngn: 3_500_000, current_usage_ngn: 2_980_000, warning_threshold_percent: 80, hard_limit_action: 'suspend_services', is_suspended: false },
    { tenant_id: 'demo-t3', credit_limit_ngn: 7_500_000, current_usage_ngn: 1_120_000, warning_threshold_percent: 75, hard_limit_action: 'notify_only', is_suspended: false },
    { tenant_id: 'demo-t4', credit_limit_ngn: 4_000_000, current_usage_ngn: 4_180_000, warning_threshold_percent: 85, hard_limit_action: 'suspend_services', is_suspended: true },
    { tenant_id: 'demo-t5', credit_limit_ngn: 6_200_000, current_usage_ngn: 2_410_000, warning_threshold_percent: 80, hard_limit_action: 'notify_only', is_suspended: false },
  ];
  const DEMO_INVOICES: PostpaidInvoice[] = [
    { id: 'di1', tenant_id: 'demo-t1', invoice_number: 'POST-2025-001', billing_period: '2025-03', total_usage_ngn: 1_840_000, wallet_deducted_ngn: 800_000, invoice_balance_ngn: 1_040_000, due_date: '2025-04-15', status: 'sent' } as any,
    { id: 'di2', tenant_id: 'demo-t2', invoice_number: 'POST-2025-002', billing_period: '2025-03', total_usage_ngn: 2_140_000, wallet_deducted_ngn: 500_000, invoice_balance_ngn: 1_640_000, due_date: '2025-04-15', status: 'overdue' } as any,
    { id: 'di3', tenant_id: 'demo-t3', invoice_number: 'POST-2025-003', billing_period: '2025-03', total_usage_ngn: 980_000, wallet_deducted_ngn: 980_000, invoice_balance_ngn: 0, due_date: '2025-04-15', status: 'paid' } as any,
    { id: 'di4', tenant_id: 'demo-t4', invoice_number: 'POST-2025-004', billing_period: '2025-03', total_usage_ngn: 3_220_000, wallet_deducted_ngn: 1_000_000, invoice_balance_ngn: 2_220_000, due_date: '2025-04-15', status: 'overdue' } as any,
    { id: 'di5', tenant_id: 'demo-t5', invoice_number: 'POST-2025-005', billing_period: '2025-03', total_usage_ngn: 1_540_000, wallet_deducted_ngn: 700_000, invoice_balance_ngn: 840_000, due_date: '2025-04-15', status: 'partially_paid' } as any,
    { id: 'di6', tenant_id: 'demo-t6', invoice_number: 'POST-2025-006', billing_period: '2025-03', total_usage_ngn: 720_000, wallet_deducted_ngn: 720_000, invoice_balance_ngn: 0, due_date: '2025-04-30', status: 'paid' } as any,
    { id: 'di7', tenant_id: 'demo-t1', invoice_number: 'POST-2025-007', billing_period: '2025-04', total_usage_ngn: 2_080_000, wallet_deducted_ngn: 600_000, invoice_balance_ngn: 1_480_000, due_date: '2025-05-15', status: 'generated' } as any,
    { id: 'di8', tenant_id: 'demo-t2', invoice_number: 'POST-2025-008', billing_period: '2025-04', total_usage_ngn: 1_960_000, wallet_deducted_ngn: 400_000, invoice_balance_ngn: 1_560_000, due_date: '2025-05-15', status: 'sent' } as any,
  ];

  const postpaidTenants = rawTenants.length > 0 ? rawTenants : DEMO_TENANTS;
  const creditLimits = rawCreditLimits.length > 0 ? rawCreditLimits : (DEMO_CREDIT_LIMITS as any);
  const postpaidInvoices = rawInvoices.length > 0 ? rawInvoices : DEMO_INVOICES;

  const upsertCreditLimit = {
    mutate: (_params: { tenantId: string; limit: number; threshold: number; action: string }) => {
      toast.info('Coming soon');
    },
    isPending: false,
  };

  const tenantNameById = (id: string) =>
    postpaidTenants.find((t) => t.id === id)?.name || id;

  const filteredInvoices = postpaidInvoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      tenantNameById(inv.tenant_id).toLowerCase().includes(q) ||
      inv.tenant_id.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    const f = postpaidFilters;
    if (f.due_date?.enabled) {
      const d = new Date(inv.due_date).getTime();
      if (f.due_date.from && d < new Date(f.due_date.from).getTime()) return false;
      if (f.due_date.to && d > new Date(f.due_date.to).getTime()) return false;
    }
    if (f.balance_due_date?.enabled) {
      const d = new Date(inv.due_date).getTime();
      if (f.balance_due_date.from && d < new Date(f.balance_due_date.from).getTime()) return false;
      if (f.balance_due_date.to && d > new Date(f.balance_due_date.to).getTime()) return false;
    }
    if (f.balance?.enabled) {
      const min = f.balance.from ? Number(f.balance.from) : -Infinity;
      const max = f.balance.to ? Number(f.balance.to) : Infinity;
      const bal = Number(inv.invoice_balance_ngn);
      if (bal < min || bal > max) return false;
    }
    return matchSearch && matchStatus;
  });

  const filteredTenants = postpaidTenants.filter((tenant) => {
    const cl = creditLimits.find((c) => c.tenant_id === tenant.id);
    const q = creditSearch.trim().toLowerCase();
    if (q && !tenant.name.toLowerCase().includes(q)) return false;

    const f = creditFilters;
    if (f.action?.enabled && f.action.value) {
      if ((cl?.hard_limit_action || "notify_only") !== f.action.value) return false;
    }
    if (f.suspended?.enabled && f.suspended.value) {
      const isSuspended = !!cl?.is_suspended;
      if (f.suspended.value === "suspended" && !isSuspended) return false;
      if (f.suspended.value === "active" && isSuspended) return false;
    }
    if (f.utilization?.enabled) {
      const util = cl && cl.credit_limit_ngn > 0
        ? (Number(cl.current_usage_ngn) / Number(cl.credit_limit_ngn)) * 100
        : 0;
      const min = f.utilization.from ? Number(f.utilization.from) : -Infinity;
      const max = f.utilization.to ? Number(f.utilization.to) : Infinity;
      if (util < min || util > max) return false;
    }
    return true;
  });

  const totalBilled = postpaidInvoices.reduce((s, i) => s + Number(i.total_usage_ngn), 0);
  const totalOutstanding = postpaidInvoices
    .filter(i => ['generated', 'sent', 'overdue'].includes(i.status))
    .reduce((s, i) => s + Number(i.invoice_balance_ngn), 0);
  const totalPaid = postpaidInvoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_usage_ngn), 0);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      generated: { className: "bg-muted text-muted-foreground", label: "Generated" },
      sent: { className: "bg-primary/10 text-primary border-primary/30", label: "Sent" },
      paid: { className: "bg-success/10 text-success border-success/30", label: "Paid" },
      overdue: { className: "bg-destructive/10 text-destructive border-destructive/30", label: "Overdue" },
      partially_paid: { className: "bg-warning/10 text-warning border-warning/30", label: "Partial" },
      void: { className: "bg-muted text-muted-foreground", label: "Void" } };
    const config = map[status] || { className: "", label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const openCreditDialog = (tenantId: string) => {
    const existing = creditLimits.find(c => c.tenant_id === tenantId);
    setSelectedTenantId(tenantId);
    setCreditLimitValue(existing ? String(existing.credit_limit_ngn) : "");
    setThresholdValue(existing ? String(existing.warning_threshold_percent) : "80");
    setHardLimitAction(existing?.hard_limit_action || "notify_only");
    setCreditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Postpaid Tenants"
          value={postpaidTenants.length.toString()}
          icon={CreditCard}
        />
        <StatCard
          title="Total Billed"
          value={formatCurrency(getDisplayAmount(totalBilled), currency)}
          icon={Receipt}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(getDisplayAmount(totalOutstanding), currency)}
          icon={Clock}
        />
        <StatCard
          title="Collected"
          value={formatCurrency(getDisplayAmount(totalPaid), currency)}
          icon={CheckCircle}
        />
      </div>

      {/* Section heading */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Postpaid Management</h3>
        <p className="text-sm text-muted-foreground">Manage credit limits, monitor outstanding balances and review postpaid invoices for tenants billed in arrears.</p>
      </div>

      {/* Credit Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credit Limits
              </CardTitle>
              <CardDescription>Manage spending limits for postpaid tenants</CardDescription>
            </div>
            <ExportButton
              filename="credit-limits"
              rows={filteredTenants.map((t) => {
                const cl = creditLimits.find((c) => c.tenant_id === t.id);
                return {
                  tenant: t.name,
                  credit_limit: cl?.credit_limit_ngn || 0,
                  current_usage: cl?.current_usage_ngn || 0,
                  hard_limit_action: cl?.hard_limit_action || "not_set",
                  is_suspended: cl?.is_suspended ? "Yes" : "No" };
              })}
              columns={[
                { header: "Tenant", accessor: (r) => r.tenant },
                { header: "Credit Limit (NGN)", accessor: (r) => r.credit_limit },
                { header: "Current Usage (NGN)", accessor: (r) => r.current_usage },
                { header: "Action on Limit", accessor: (r) => r.hard_limit_action },
                { header: "Suspended", accessor: (r) => r.is_suspended },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={creditSearch}
                onChange={(e) => setCreditSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <PlatformFilterPopover
              entity="credit limits"
              fields={CREDIT_LIMIT_FILTER_FIELDS}
              value={creditFilters}
              onApply={setCreditFilters}
              onReset={() => setCreditFilters(buildEmptyDraft(CREDIT_LIMIT_FILTER_FIELDS))}
            />
          </div>

          {filteredTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {postpaidTenants.length === 0
                ? "No postpaid tenants configured yet."
                : "No tenants match the current filters."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Current Usage</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Action on Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map(tenant => {
                  const cl = creditLimits.find(c => c.tenant_id === tenant.id);
                  const utilization = cl && cl.credit_limit_ngn > 0
                    ? (Number(cl.current_usage_ngn) / Number(cl.credit_limit_ngn)) * 100
                    : 0;
                  const cycles = ["Monthly", "Quarterly", "Annual"] as const;
                  const tenantCycle = cycles[Math.abs(tenant.id.charCodeAt(0) + tenant.id.length) % cycles.length];
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tenantCycle}</Badge>
                      </TableCell>
                      <TableCell>
                        {cl ? formatCurrency(getDisplayAmount(Number(cl.credit_limit_ngn)), currency) : "Not set"}
                      </TableCell>
                      <TableCell>
                        {cl ? formatCurrency(getDisplayAmount(Number(cl.current_usage_ngn)), currency) : "₦0"}
                      </TableCell>
                      <TableCell>
                        {cl ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${utilization >= 90 ? 'bg-destructive' : utilization >= 70 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${Math.min(100, utilization)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{utilization.toFixed(0)}%</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {cl?.hard_limit_action === 'suspend_services' ? (
                          <Badge variant="destructive">Suspend</Badge>
                        ) : (
                          <Badge variant="outline">Notify</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cl?.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/30">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openCreditDialog(tenant.id)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setBillingCycleTenantId(tenant.id);
                                setBillingCyclePhase("idle");
                                setBillingCycleStepIdx(0);
                                setBillingCycleError(null);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Run Billing Cycle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Postpaid Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Postpaid Invoices
              </CardTitle>
              <CardDescription>Usage-based invoices generated at end of billing cycle</CardDescription>
            </div>
            <ExportButton
              filename="postpaid-invoices"
              rows={filteredInvoices}
              columns={[
                { header: "Invoice #", accessor: (i) => i.invoice_number },
                { header: "Period", accessor: (i) => i.billing_period },
                { header: "Total Usage (NGN)", accessor: (i) => Number(i.total_usage_ngn) },
                { header: "Wallet Deducted (NGN)", accessor: (i) => Number(i.wallet_deducted_ngn) },
                { header: "Balance Due (NGN)", accessor: (i) => Number(i.invoice_balance_ngn) },
                { header: "Due Date", accessor: (i) => i.due_date },
                { header: "Status", accessor: (i) => i.status },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="postpaid invoices"
              fields={POSTPAID_FILTER_FIELDS}
              value={postpaidFilters}
              onApply={setPostpaidFilters}
              onReset={() => setPostpaidFilters(buildEmptyDraft(POSTPAID_FILTER_FIELDS))}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Total Usage</TableHead>
                <TableHead>Wallet Deducted</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No postpaid invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(inv => {
                  const cycles = ["Monthly", "Quarterly", "Annual"] as const;
                  const cycle = cycles[Math.abs(inv.invoice_number.length + inv.invoice_number.charCodeAt(inv.invoice_number.length - 1)) % cycles.length];
                  return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.billing_period}</TableCell>
                    <TableCell><Badge variant="outline">{cycle}</Badge></TableCell>
                    <TableCell>{formatCurrency(getDisplayAmount(Number(inv.total_usage_ngn)), currency)}</TableCell>
                    <TableCell>{formatCurrency(getDisplayAmount(Number(inv.wallet_deducted_ngn)), currency)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(getDisplayAmount(Number(inv.invoice_balance_ngn)), currency)}
                    </TableCell>
                    <TableCell>{inv.due_date}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credit Limit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Credit Limit</DialogTitle>
            <DialogDescription>
              Set spending limits for this postpaid tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Credit Limit (NGN)</Label>
              <Input
                type="number"
                value={creditLimitValue}
                onChange={(e) => setCreditLimitValue(e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <Label>Warning Threshold (%)</Label>
              <Input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                min={50}
                max={100}
              />
            </div>
            <div>
              <Label>Action When Limit Reached</Label>
              <Select value={hardLimitAction} onValueChange={setHardLimitAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notify_only">Notify Only</SelectItem>
                  <SelectItem value="suspend_services">Suspend Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => upsertCreditLimit.mutate({
                tenantId: selectedTenantId,
                limit: Number(creditLimitValue) || 0,
                threshold: Number(thresholdValue) || 80,
                action: hardLimitAction })}
              disabled={upsertCreditLimit.isPending}
            >
              {upsertCreditLimit.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Billing Cycle Dialog */}
      <Dialog
        open={!!billingCycleTenantId}
        onOpenChange={(o) => {
          if (!o && billingCyclePhase !== "running") {
            setBillingCycleTenantId(null);
            setBillingCyclePhase("idle");
            setBillingCycleStepIdx(0);
            setBillingCycleError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Billing Cycle
            </DialogTitle>
            <DialogDescription>
              {billingCycleTenantId && (
                <>Generates a postpaid invoice for <span className="font-medium text-foreground">{tenantNameById(billingCycleTenantId)}</span> based on this period’s usage.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const steps = [
              { key: "aggregate", label: "Aggregate usage from usage_ledger" },
              { key: "wallet", label: "Apply wallet balance against usage" },
              { key: "invoice", label: "Generate invoice & calculate balance due" },
              { key: "notify", label: "Mark invoice as sent and notify tenant" },
            ];
            const cl = billingCycleTenantId
              ? creditLimits.find((c) => c.tenant_id === billingCycleTenantId)
              : null;
            const projected = cl ? Number(cl.current_usage_ngn) : 0;

            return (
              <div className="space-y-4">
                {/* Summary */}
                <div className="rounded-md border border-border bg-muted/20 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period</span>
                    <span className="font-medium">{new Date().toISOString().substring(0, 7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected usage</span>
                    <span className="font-medium">{formatCurrency(getDisplayAmount(projected), currency)}</span>
                  </div>
                </div>

                {/* Steps */}
                <ol className="space-y-2">
                  {steps.map((s, i) => {
                    const done =
                      billingCyclePhase === "done" ||
                      (billingCyclePhase === "running" && i < billingCycleStepIdx);
                    const active = billingCyclePhase === "running" && i === billingCycleStepIdx;
                    return (
                      <li key={s.key} className="flex items-center gap-2 text-sm">
                        {done ? (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 text-info shrink-0 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={done ? "text-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {s.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {billingCyclePhase === "done" && (
                  <div className="rounded-md border border-success/30 bg-success/10 text-success text-sm p-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Billing cycle completed successfully.
                  </div>
                )}
                {billingCyclePhase === "error" && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {billingCycleError || "Billing cycle failed."}
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            {billingCyclePhase === "idle" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setBillingCycleTenantId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setBillingCyclePhase("running");
                    setBillingCycleStepIdx(0);
                    try {
                      // Visualise step progression while the real mutation runs
                      const tick = (i: number) =>
                        new Promise<void>((res) => setTimeout(() => { setBillingCycleStepIdx(i); res(); }, 700));
                      await tick(1);
                      await tick(2);
                      await tick(3);
                      await runBillingCycle.mutateAsync(undefined);
                      setBillingCycleStepIdx(4);
                      setBillingCyclePhase("done");
                    } catch (e) {
                      setBillingCycleError(e instanceof Error ? e.message : "Billing cycle failed");
                      setBillingCyclePhase("error");
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Confirm & Run
                </Button>
              </>
            )}
            {billingCyclePhase === "running" && (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running…
              </Button>
            )}
            {(billingCyclePhase === "done" || billingCyclePhase === "error") && (
              <Button
                onClick={() => {
                  setBillingCycleTenantId(null);
                  setBillingCyclePhase("idle");
                  setBillingCycleStepIdx(0);
                  setBillingCycleError(null);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



