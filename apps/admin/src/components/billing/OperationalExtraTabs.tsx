import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import {
  DollarSign, Search, CheckCircle, Clock, XCircle,
  Banknote, Users as UsersIcon, Truck, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { ExportButton } from "@/components/shadcn/export-button";
import { formatCurrency } from "@/lib/currency";

// ─── Payouts ──────────────────────────────────────────────────────────────
type PayoutStatus = "paid" | "scheduled" | "processing" | "failed";
interface Payout {
  id: string;
  reference: string;
  recipient: string;
  recipientType: "Driver" | "Owner-Operator" | "Fleet Provider";
  jobsCount: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
  status: PayoutStatus;
  scheduledDate: string;
  paidDate: string | null;
  method: "MTN MoMo" | "Bank Transfer";
}

const DEMO_PAYOUTS: Payout[] = [
  { id: "p-1", reference: "PO-2026-0042", recipient: "Adebayo Okafor", recipientType: "Driver", jobsCount: 12, grossAmount: 480000, fees: 9600, netAmount: 470400, status: "paid", scheduledDate: "2026-04-22", paidDate: "2026-04-22", method: "MTN MoMo" },
  { id: "p-2", reference: "PO-2026-0043", recipient: "Chinedu Eze", recipientType: "Owner-Operator", jobsCount: 8, grossAmount: 720000, fees: 14400, netAmount: 705600, status: "paid", scheduledDate: "2026-04-22", paidDate: "2026-04-22", method: "Bank Transfer" },
  { id: "p-3", reference: "PO-2026-0044", recipient: "Northwest Logistics Ltd", recipientType: "Fleet Provider", jobsCount: 34, grossAmount: 2480000, fees: 49600, netAmount: 2430400, status: "processing", scheduledDate: "2026-04-25", paidDate: null, method: "Bank Transfer" },
  { id: "p-4", reference: "PO-2026-0045", recipient: "Ibrahim Musa", recipientType: "Driver", jobsCount: 6, grossAmount: 240000, fees: 4800, netAmount: 235200, status: "scheduled", scheduledDate: "2026-04-29", paidDate: null, method: "MTN MoMo" },
  { id: "p-5", reference: "PO-2026-0040", recipient: "Tunde Akinwale", recipientType: "Driver", jobsCount: 4, grossAmount: 160000, fees: 3200, netAmount: 156800, status: "failed", scheduledDate: "2026-04-19", paidDate: null, method: "MTN MoMo" },
];

function payoutStatusBadge(s: PayoutStatus) {
  const map: Record<PayoutStatus, { label: string; cls: string; Icon: any }> = {
    paid: { label: "Paid", cls: "bg-green-500/10 text-green-600 border-green-500/20", Icon: CheckCircle },
    scheduled: { label: "Scheduled", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", Icon: Clock },
    processing: { label: "Processing", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", Icon: Clock },
    failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle } };
  const { label, cls, Icon } = map[s];
  return <Badge variant="outline" className={cls}><Icon className="h-3 w-3 mr-1" />{label}</Badge>;
}

export function PayoutsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => DEMO_PAYOUTS.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.reference.toLowerCase().includes(q) || p.recipient.toLowerCase().includes(q);
      }
      return true;
    }),
    [search, statusFilter],
  );

  const totalPaid = DEMO_PAYOUTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.netAmount, 0);
  const pending = DEMO_PAYOUTS.filter((p) => p.status === "scheduled" || p.status === "processing").reduce((s, p) => s + p.netAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Paid (this month)" value={formatCurrency(totalPaid, "NGN")} Icon={Banknote} tone="text-green-600 bg-green-500/10" />
        <StatTile label="Pending payouts" value={formatCurrency(pending, "NGN")} Icon={Clock} tone="text-amber-600 bg-amber-500/10" />
        <StatTile label="Recipients" value={String(new Set(DEMO_PAYOUTS.map((p) => p.recipient)).size)} Icon={UsersIcon} tone="text-blue-600 bg-blue-500/10" />
        <StatTile label="Failed" value={String(DEMO_PAYOUTS.filter((p) => p.status === "failed").length)} Icon={XCircle} tone="text-destructive bg-destructive/10" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Payouts</CardTitle>
              <CardDescription>Driver, owner-operator and fleet provider settlements</CardDescription>
            </div>
            <ExportButton
              filename="payouts"
              rows={filtered}
              columns={[
                { header: "Reference", accessor: (p) => p.reference },
                { header: "Recipient", accessor: (p) => p.recipient },
                { header: "Type", accessor: (p) => p.recipientType },
                { header: "Jobs", accessor: (p) => p.jobsCount },
                { header: "Gross", accessor: (p) => p.grossAmount },
                { header: "Fees", accessor: (p) => p.fees },
                { header: "Net", accessor: (p) => p.netAmount },
                { header: "Status", accessor: (p) => p.status },
                { header: "Paid date", accessor: (p) => p.paidDate ?? "" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reference or recipient..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card/50 border-border/50" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-medium">{p.reference}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.recipient}</p>
                      <p className="text-xs text-muted-foreground">{p.recipientType}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.jobsCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.grossAmount, "NGN")}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(p.netAmount, "NGN")}</TableCell>
                  <TableCell className="text-sm">{p.method}</TableCell>
                  <TableCell>{payoutStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.paidDate ?? p.scheduledDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Settlements / Earnings ───────────────────────────────────────────────
interface Settlement {
  id: string;
  period: string;
  jobs: number;
  revenue: number;
  costs: number;
  platformFee: number;
  netEarnings: number;
  status: "settled" | "pending";
}

const DEMO_SETTLEMENTS: Settlement[] = [
  { id: "s-1", period: "April 2026 — Week 4", jobs: 47, revenue: 8420000, costs: 1240000, platformFee: 168400, netEarnings: 7011600, status: "pending" },
  { id: "s-2", period: "April 2026 — Week 3", jobs: 52, revenue: 9180000, costs: 1320000, platformFee: 183600, netEarnings: 7676400, status: "settled" },
  { id: "s-3", period: "April 2026 — Week 2", jobs: 41, revenue: 7350000, costs: 1080000, platformFee: 147000, netEarnings: 6123000, status: "settled" },
  { id: "s-4", period: "April 2026 — Week 1", jobs: 38, revenue: 6720000, costs: 990000, platformFee: 134400, netEarnings: 5595600, status: "settled" },
];

export function SettlementsTab() {
  const totalEarnings = DEMO_SETTLEMENTS.reduce((s, x) => s + x.netEarnings, 0);
  const totalRevenue = DEMO_SETTLEMENTS.reduce((s, x) => s + x.revenue, 0);
  const totalJobs = DEMO_SETTLEMENTS.reduce((s, x) => s + x.jobs, 0);
  const pendingAmount = DEMO_SETTLEMENTS.filter((s) => s.status === "pending").reduce((s, x) => s + x.netEarnings, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Net earnings (4w)" value={formatCurrency(totalEarnings, "NGN")} Icon={TrendingUp} tone="text-green-600 bg-green-500/10" />
        <StatTile label="Gross revenue (4w)" value={formatCurrency(totalRevenue, "NGN")} Icon={Wallet} tone="text-primary bg-primary/10" />
        <StatTile label="Pending settlement" value={formatCurrency(pendingAmount, "NGN")} Icon={Clock} tone="text-amber-600 bg-amber-500/10" />
        <StatTile label="Jobs completed" value={String(totalJobs)} Icon={Truck} tone="text-blue-600 bg-blue-500/10" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Settlements & Earnings</CardTitle>
            <CardDescription>Weekly business earnings after platform fees</CardDescription>
          </div>
          <ExportButton
            filename="settlements"
            rows={DEMO_SETTLEMENTS}
            columns={[
              { header: "Period", accessor: (s) => s.period },
              { header: "Jobs", accessor: (s) => s.jobs },
              { header: "Revenue", accessor: (s) => s.revenue },
              { header: "Costs", accessor: (s) => s.costs },
              { header: "Platform Fee", accessor: (s) => s.platformFee },
              { header: "Net Earnings", accessor: (s) => s.netEarnings },
              { header: "Status", accessor: (s) => s.status },
            ]}
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Platform Fee (2%)</TableHead>
                <TableHead className="text-right">Net Earnings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_SETTLEMENTS.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{s.period}</TableCell>
                  <TableCell>{s.jobs}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.revenue, "NGN")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">−{formatCurrency(s.costs, "NGN")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">−{formatCurrency(s.platformFee, "NGN")}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{formatCurrency(s.netEarnings, "NGN")}</TableCell>
                  <TableCell>
                    {s.status === "settled" ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Settled</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Customer Billing ─────────────────────────────────────────────────────
interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  outstanding: number;
  ytdRevenue: number;
  invoicesIssued: number;
  lastInvoice: string;
  status: "current" | "overdue";
}

const DEMO_CUSTOMERS: CustomerAccount[] = [
  { id: "c-1", name: "Dangote Cement", phone: "+234 801 111 2222", outstanding: 0, ytdRevenue: 12480000, invoicesIssued: 18, lastInvoice: "2026-04-22", status: "current" },
  { id: "c-2", name: "Nigerian Breweries", phone: "+234 802 333 4444", outstanding: 720000, ytdRevenue: 8240000, invoicesIssued: 14, lastInvoice: "2026-04-23", status: "current" },
  { id: "c-3", name: "BUA Foods", phone: "+234 803 555 6666", outstanding: 1840000, ytdRevenue: 5320000, invoicesIssued: 11, lastInvoice: "2026-04-15", status: "overdue" },
  { id: "c-4", name: "Flour Mills of Nigeria", phone: "+234 804 777 8888", outstanding: 0, ytdRevenue: 9840000, invoicesIssued: 16, lastInvoice: "2026-04-24", status: "current" },
  { id: "c-5", name: "Cadbury Nigeria", phone: "+234 805 999 0000", outstanding: 320000, ytdRevenue: 4180000, invoicesIssued: 9, lastInvoice: "2026-04-21", status: "current" },
  { id: "c-6", name: "Innoson Motors", phone: "+234 806 121 3434", outstanding: 580000, ytdRevenue: 3640000, invoicesIssued: 7, lastInvoice: "2026-04-24", status: "current" },
];

export function CustomerBillingTab() {
  const [search, setSearch] = useState("");
  const filtered = DEMO_CUSTOMERS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const totalOutstanding = DEMO_CUSTOMERS.reduce((s, c) => s + c.outstanding, 0);
  const totalYtd = DEMO_CUSTOMERS.reduce((s, c) => s + c.ytdRevenue, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Active customers" value={String(DEMO_CUSTOMERS.length)} Icon={UsersIcon} tone="text-primary bg-primary/10" />
        <StatTile label="Outstanding" value={formatCurrency(totalOutstanding, "NGN")} Icon={Clock} tone="text-amber-600 bg-amber-500/10" />
        <StatTile label="YTD revenue" value={formatCurrency(totalYtd, "NGN")} Icon={TrendingUp} tone="text-green-600 bg-green-500/10" />
        <StatTile label="Overdue accounts" value={String(DEMO_CUSTOMERS.filter((c) => c.status === "overdue").length)} Icon={XCircle} tone="text-destructive bg-destructive/10" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" />Customer Billing</CardTitle>
              <CardDescription>Customer accounts, outstanding balances and invoicing history</CardDescription>
            </div>
            <ExportButton
              filename="customer-billing"
              rows={filtered}
              columns={[
                { header: "Customer", accessor: (c) => c.name },
                { header: "Phone", accessor: (c) => c.phone },
                { header: "Invoices", accessor: (c) => c.invoicesIssued },
                { header: "YTD Revenue", accessor: (c) => c.ytdRevenue },
                { header: "Outstanding", accessor: (c) => c.outstanding },
                { header: "Last Invoice", accessor: (c) => c.lastInvoice },
                { header: "Status", accessor: (c) => c.status },
              ]}
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card/50 border-border/50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">YTD Revenue</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Last Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{c.invoicesIssued}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.ytdRevenue, "NGN")}</TableCell>
                  <TableCell className="text-right">
                    {c.outstanding > 0 ? (
                      <span className="font-semibold text-amber-600">{formatCurrency(c.outstanding, "NGN")}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastInvoice}</TableCell>
                  <TableCell>
                    {c.status === "current" ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Current</Badge>
                    ) : (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      Statement <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ label, value, Icon, tone }: { label: string; value: string; Icon: any; tone: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2.5">
        <div className={`h-10 w-10 rounded-lg ${tone} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}



