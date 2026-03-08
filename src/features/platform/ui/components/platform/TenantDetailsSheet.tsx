import { TenantData } from "@/hooks/useTenants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantKYCVerification } from "./TenantKYCVerification";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Shield,
  CreditCard,
  Cpu,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Truck,
  Users,
  Hash,
  Building,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface TenantDetailsSheetProps {
  tenant: TenantData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planDetails = {
  starter: { name: "Starter", priceNGN: 774500, priceUSD: 499, color: "bg-muted text-muted-foreground" },
  professional: { name: "Professional", priceNGN: 2323500, priceUSD: 1499, color: "bg-primary/10 text-primary" },
  enterprise: { name: "Enterprise", priceNGN: 7748500, priceUSD: 4999, color: "bg-success/10 text-success" },
};

export function TenantDetailsSheet({ tenant, open, onOpenChange }: TenantDetailsSheetProps) {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();

  // Fetch Owner-Operator orgs under this tenant for vehicle cap management
  const { data: ooOrgs = [] } = useQuery({
    queryKey: ["tenant-oo-orgs", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, organization_type, max_vehicles, status")
        .eq("tenant_id", tenant!.id)
        .eq("organization_type", "OWNER_OPERATOR")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && open,
  });

  // Fetch vehicle counts per org
  const { data: vehicleCounts = {} } = useQuery({
    queryKey: ["tenant-oo-vehicle-counts", ooOrgs.map(o => o.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const org of ooOrgs) {
        const { count } = await supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("owning_org_id", org.id);
        counts[org.id] = count ?? 0;
      }
      return counts;
    },
    enabled: ooOrgs.length > 0,
  });

  const [editingCaps, setEditingCaps] = useState<Record<string, number>>({});
  const [savingOrgId, setSavingOrgId] = useState<string | null>(null);

  const handleSaveVehicleCap = async (orgId: string) => {
    const newCap = editingCaps[orgId];
    if (newCap === undefined) return;
    if (newCap < 1 || newCap > 10) {
      toast.error("Vehicle cap must be between 1 and 10");
      return;
    }
    setSavingOrgId(orgId);
    const { error } = await supabase
      .from("organizations")
      .update({ max_vehicles: newCap })
      .eq("id", orgId);
    setSavingOrgId(null);
    if (error) {
      toast.error("Failed to update vehicle cap");
      return;
    }
    toast.success(`Vehicle cap updated to ${newCap}`);
    setEditingCaps(prev => {
      const next = { ...prev };
      delete next[orgId];
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ["tenant-oo-orgs"] });
  };

  if (!tenant) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (status: string | null | undefined) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatPrice = (plan: keyof typeof planDetails) => {
    return currency === "NGN"
      ? `₦${planDetails[plan].priceNGN.toLocaleString()}`
      : `$${planDetails[plan].priceUSD.toLocaleString()}`;
  };

  const fullAddress = tenant.businessInfo
    ? [
        tenant.businessInfo.addressLine1,
        tenant.businessInfo.addressLine2,
        tenant.businessInfo.city,
        tenant.businessInfo.state,
        tenant.businessInfo.postalCode,
        tenant.businessInfo.country,
      ]
        .filter(Boolean)
        .join(", ")
    : tenant.address;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {tenant.name.charAt(0)}
            </div>
            <div>
              <span>{tenant.name}</span>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(tenant.status)}
                <Badge className={planDetails[tenant.plan].color}>
                  {planDetails[tenant.plan].name}
                </Badge>
              </div>
            </div>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Member since {format(new Date(tenant.createdAt), "MMMM yyyy")}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              KYC & Docs
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Business Information */}
                {tenant.businessInfo && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">Business Information</h4>
                        {getVerificationBadge(tenant.businessInfo.verificationStatus)}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Company:</span>
                            <span className="font-medium">{tenant.businessInfo.companyName}</span>
                          </div>
                          {tenant.businessInfo.registrationNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Reg No:</span>
                              <span className="font-medium">{tenant.businessInfo.registrationNumber}</span>
                            </div>
                          )}
                          {tenant.businessInfo.taxId && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tax ID:</span>
                              <span className="font-medium">{tenant.businessInfo.taxId}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {tenant.businessInfo.businessType && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Type:</span>
                              <span className="font-medium">{tenant.businessInfo.businessType}</span>
                            </div>
                          )}
                          {tenant.businessInfo.industry && (
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Industry:</span>
                              <span className="font-medium">{tenant.businessInfo.industry}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {tenant.email}
                    </div>
                    {tenant.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {tenant.phone}
                      </div>
                    )}
                    {fullAddress && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {fullAddress}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Usage Statistics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Resource Usage</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">IoT Devices</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{tenant.deviceCount}</p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">SIM Cards</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{tenant.simCount}</p>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Owner-Operator Vehicle Caps */}
                {ooOrgs.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Owner-Operator Vehicle Caps</h4>
                      <div className="space-y-3">
                        {ooOrgs.map((org) => {
                          const currentCount = vehicleCounts[org.id] ?? 0;
                          const currentCap = editingCaps[org.id] ?? (org as any).max_vehicles ?? 7;
                          const isEditing = editingCaps[org.id] !== undefined;
                          return (
                            <Card key={org.id} className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{org.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {currentCount} vehicle{currentCount !== 1 ? "s" : ""} registered
                                  </p>
                                </div>
                                <Badge variant={org.status === "ACTIVE" ? "default" : "secondary"}>
                                  {org.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Max vehicles</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={currentCap}
                                  onChange={(e) => setEditingCaps(prev => ({
                                    ...prev,
                                    [org.id]: Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                                  }))}
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-xs text-muted-foreground">/ 10 max</span>
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    disabled={savingOrgId === org.id}
                                    onClick={() => handleSaveVehicleCap(org.id)}
                                  >
                                    <Save className="h-3.5 w-3.5 mr-1" />
                                    Save
                                  </Button>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}


                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Enabled Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(tenant.features).map(([feature, enabled]) => (
                      <div
                        key={feature}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                          enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {enabled ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="capitalize">{feature.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="kyc" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <TenantKYCVerification tenantId={tenant.id} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Subscription Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Subscription</h4>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{planDetails[tenant.plan].name} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(tenant.plan)}/month
                        </p>
                      </div>
                      <Badge className={planDetails[tenant.plan].color}>
                        {tenant.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Billing Contact */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing Contact</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {tenant.billingEmail || tenant.email}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
