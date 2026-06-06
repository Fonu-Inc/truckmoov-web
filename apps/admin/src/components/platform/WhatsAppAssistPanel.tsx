import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Phone,
  Loader2,
  MoreHorizontal,
  Plus,
  Link,
  Unlink,
  Star,
  Eye,
  Activity,
  Clock,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  status: string;
  kyc_status?: string;
}

interface WhatsAppAccount {
  id: string;
  tenant_id: string;
  status: string;
  connection_method: string | null;
  waba_id: string | null;
  phone_number_id: string | null;
  display_phone_number: string | null;
  verified_name: string | null;
  is_default_sender: boolean;
  quality_rating: string | null;
  connected_at: string | null;
  created_at: string;
}

export function WhatsAppAssistPanel() {
  const [tenants] = useState<Tenant[]>([]);
  const [accounts] = useState<WhatsAppAccount[]>([]);
  const [isLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState("all");
  const [defaultSenderFilter, setDefaultSenderFilter] = useState("all");
  const [auditTenant, setAuditTenant] = useState<Tenant | null>(null);

  // Form state for adding sender
  const [formData, setFormData] = useState({
    waba_id: "",
    phone_number_id: "",
    display_phone_number: "",
    verified_name: "",
    token_reference_id: "",
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      CONNECTED: { color: "bg-success text-white", label: "Connected" },
      PENDING: { color: "bg-warning text-white", label: "Pending" },
      NOT_CONNECTED: { color: "bg-muted text-muted-foreground", label: "Not Connected" },
      NEEDS_ATTENTION: { color: "bg-destructive text-white", label: "Needs Attention" },
      DISABLED: { color: "bg-muted text-muted-foreground", label: "Disabled" },
    };
    const { color, label } = config[status] || config.NOT_CONNECTED;
    return <Badge className={color}>{label}</Badge>;
  };

  const getKycBadge = (status?: string) => {
    const config: Record<string, { color: string; label: string }> = {
      approved: { color: "bg-success/20 text-success", label: "KYC Approved" },
      pending: { color: "bg-warning/20 text-warning", label: "KYC Pending" },
      rejected: { color: "bg-destructive/20 text-destructive", label: "KYC Rejected" },
    };
    const { color, label } = config[status || "pending"] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const handleAddSender = async () => {
    toast.info('Coming soon');
    return;
  };

  const handleDisconnect = async (account: WhatsAppAccount) => {
    toast.info('Coming soon');
    return;
  };

  const handleSetDefault = async (account: WhatsAppAccount) => {
    toast.info('Coming soon');
    return;
  };

  const getTenantAccounts = (tenantId: string) => accounts.filter((a) => a.tenant_id === tenantId);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.includes(searchQuery);
    if (!matchesSearch) return false;
    if (kycFilter !== "all" && t.kyc_status !== kycFilter) return false;
    const tAccounts = getTenantAccounts(t.id);
    const hasConnected = tAccounts.some((a) => a.status === "CONNECTED");
    if (statusFilter !== "all") {
      const effective = hasConnected ? "CONNECTED" : tAccounts[0]?.status ?? "NOT_CONNECTED";
      if (effective !== statusFilter) return false;
    }
    if (connectionFilter === "with" && !hasConnected) return false;
    if (connectionFilter === "without" && hasConnected) return false;
    if (defaultSenderFilter !== "all") {
      const hasDefault = tAccounts.some((a) => a.is_default_sender && a.status === "CONNECTED");
      if (defaultSenderFilter === "yes" && !hasDefault) return false;
      if (defaultSenderFilter === "no" && hasDefault) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-success" />
            WhatsApp Assist (SuperAdmin)
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage WhatsApp Business senders for tenant organizations
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.status === "CONNECTED").length}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.status === "PENDING").length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.status === "NEEDS_ATTENTION").length}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <TableToolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search tenants by name or ID..."
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "CONNECTED", label: "Connected" },
          { value: "PENDING", label: "Pending" },
          { value: "NEEDS_ATTENTION", label: "Needs Attention" },
          { value: "NOT_CONNECTED", label: "Not Connected" },
        ]}
        filterEntity="tenants"
        filterFields={[
          {
            type: "select",
            key: "kyc",
            label: "KYC status",
            options: [
              { value: "approved", label: "Approved" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            type: "select",
            key: "connection",
            label: "Connected accounts",
            options: [
              { value: "with", label: "Has connected sender" },
              { value: "without", label: "No connected sender" },
            ],
          },
          {
            type: "select",
            key: "default_sender",
            label: "Default sender set",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
        ]}
        filterValues={{
          kyc: { enabled: kycFilter !== "all", value: kycFilter },
          connection: { enabled: connectionFilter !== "all", value: connectionFilter },
          default_sender: { enabled: defaultSenderFilter !== "all", value: defaultSenderFilter },
        }}
        onFiltersApply={(values) => {
          setKycFilter(values.kyc?.enabled ? values.kyc.value ?? "all" : "all");
          setConnectionFilter(values.connection?.enabled ? values.connection.value ?? "all" : "all");
          setDefaultSenderFilter(values.default_sender?.enabled ? values.default_sender.value ?? "all" : "all");
        }}
      />

      {/* Tenants Table */}
      <Card className="bg-card/50 border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Tenant</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>WhatsApp Status</TableHead>
              <TableHead>Default Sender</TableHead>
              <TableHead>Connected At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => {
              const tenantAccounts = getTenantAccounts(tenant.id);
              const defaultAccount = tenantAccounts.find((a) => a.is_default_sender && a.status === "CONNECTED");
              const hasConnected = tenantAccounts.some((a) => a.status === "CONNECTED");

              return (
                <TableRow key={tenant.id} className="border-border/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getKycBadge(tenant.kyc_status)}</TableCell>
                  <TableCell>
                    {hasConnected ? (
                      getStatusBadge("CONNECTED")
                    ) : tenantAccounts.length > 0 ? (
                      getStatusBadge(tenantAccounts[0].status)
                    ) : (
                      getStatusBadge("NOT_CONNECTED")
                    )}
                  </TableCell>
                  <TableCell>
                    {defaultAccount ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{defaultAccount.display_phone_number || "Not set"}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {defaultAccount?.connected_at ? (
                      <span className="text-sm">
                        {new Date(defaultAccount.connected_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Sender
                        </DropdownMenuItem>
                        {tenantAccounts.map((account) => (
                          <div key={account.id}>
                            {account.status === "CONNECTED" && !account.is_default_sender && (
                              <DropdownMenuItem onClick={() => handleSetDefault(account)}>
                                <Star className="h-4 w-4 mr-2" />
                                Set as Default
                              </DropdownMenuItem>
                            )}
                            {account.status === "CONNECTED" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDisconnect(account)}
                              >
                                <Unlink className="h-4 w-4 mr-2" />
                                Disconnect
                              </DropdownMenuItem>
                            )}
                          </div>
                        ))}
                        <DropdownMenuItem onClick={() => setAuditTenant(tenant)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Audit Log
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Add Sender Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-success" />
              Add WhatsApp Sender
            </DialogTitle>
            <DialogDescription>
              Manually configure a WhatsApp Business sender for{" "}
              <span className="font-medium text-foreground">{selectedTenant?.name}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedTenant?.kyc_status !== "approved" && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This tenant's KYC is not approved. Messaging will be blocked until verification is complete.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>WABA ID *</Label>
              <Input
                placeholder="1234567890123456"
                value={formData.waba_id}
                onChange={(e) => setFormData({ ...formData, waba_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID *</Label>
              <Input
                placeholder="1234567890123456"
                value={formData.phone_number_id}
                onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Phone Number</Label>
              <Input
                placeholder="+234 801 234 5678"
                value={formData.display_phone_number}
                onChange={(e) => setFormData({ ...formData, display_phone_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Verified Name</Label>
              <Input
                placeholder="Business Name"
                value={formData.verified_name}
                onChange={(e) => setFormData({ ...formData, verified_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Token Reference ID</Label>
              <Input
                placeholder="vault-reference-id"
                value={formData.token_reference_id}
                onChange={(e) => setFormData({ ...formData, token_reference_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Reference to the access token stored in vault</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSender} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sender
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog (centered) */}
      <Dialog open={!!auditTenant} onOpenChange={(o) => !o && setAuditTenant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Audit Log — {auditTenant?.name}
            </DialogTitle>
            <DialogDescription>
              Recent WhatsApp connection activity for this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
            {getTenantAccounts(auditTenant?.id || "").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No audit activity recorded for this tenant.
              </p>
            ) : (
              getTenantAccounts(auditTenant?.id || "").map((acc) => (
                <div key={acc.id} className="rounded-lg border border-border/50 p-3 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{acc.display_phone_number || "Unknown number"}</span>
                    <Badge variant="outline">{acc.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">WABA ID: {acc.waba_id}</p>
                  {acc.connected_at && (
                    <p className="text-xs text-muted-foreground">
                      Connected: {new Date(acc.connected_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WhatsAppAssistPanel;


