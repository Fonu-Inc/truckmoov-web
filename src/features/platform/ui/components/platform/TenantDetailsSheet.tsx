import { useQuery } from "@tanstack/react-query";
import { getSystemTenantQueryOptions } from "@/features/auth/api";
import type { OrganizationType, SystemTenantDetail, VerificationStatus } from "@/features/auth/api/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Shield,
  Smartphone,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

interface TenantDetailsSheetProps {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  fleet_provider: "Fleet Provider",
  enterprise: "Enterprise",
  aggregator: "Aggregator",
  owner_operator: "Owner-Operator",
};

const PLAN_LABELS = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
} as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: SystemTenantDetail["tenant"]["status"]) {
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
}

function getVerificationBadge(status: VerificationStatus) {
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
    case "pending":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "not_submitted":
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Not Submitted
        </Badge>
      );
  }
}

export function TenantDetailsSheet({ tenantId, open, onOpenChange }: TenantDetailsSheetProps) {
  const { data, isLoading } = useQuery({
    ...getSystemTenantQueryOptions(tenantId ?? ""),
    enabled: open && !!tenantId,
  });

  const detail = data?.data;
  const tenant = detail?.tenant;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {tenant ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                  {tenant.name.charAt(0)}
                </div>
                <div>
                  <span>{tenant.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(tenant.status)}
                    <Badge className="bg-primary/10 text-primary border-primary/30">
                      {PLAN_LABELS[tenant.plan]}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              "Tenant Details"
            )}
          </SheetTitle>
          <SheetDescription>
            {tenant ? (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member since {formatDate(tenant.createdAt)}
              </span>
            ) : (
              "Review tenant status, onboarding, and billing details."
            )}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading tenant details...</div>
        ) : !detail ? (
          <div className="py-8 text-sm text-muted-foreground">Tenant details are unavailable.</div>
        ) : (
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Onboarding
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-muted-foreground">Business Information</h4>
                      {getVerificationBadge(detail.tenant.businessInfo.verificationStatus)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{detail.tenant.businessInfo.companyName || detail.tenant.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{detail.tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{detail.tenant.phone || "—"}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{detail.tenant.address || detail.tenant.businessInfo.addressLine1 || "—"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(detail.tenant.organizationTypes.length > 0
                            ? detail.tenant.organizationTypes
                            : detail.tenant.organizationType
                              ? [detail.tenant.organizationType]
                              : []
                          ).map((orgType) => (
                            <Badge key={orgType} variant="outline" className="text-xs">
                              {ORG_TYPE_LABELS[orgType]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Resource Usage</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Vehicles</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{detail.tenant.vehicleCount}</p>
                      </Card>
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Drivers</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{detail.tenant.driverCount}</p>
                      </Card>
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Devices</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{detail.tenant.deviceCount}</p>
                      </Card>
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">SIM Cards</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{detail.tenant.simCount}</p>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Enabled Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(detail.tenant.features).map(([feature, enabled]) => (
                        <div
                          key={feature}
                          className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                            enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {enabled ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          <span>{feature.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="onboarding" className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-6 pr-4">
                  {detail.onboarding ? (
                    <>
                      <Card className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Onboarding Status</p>
                            <p className="text-sm text-muted-foreground">Admin invite: {detail.onboarding.adminInviteEmail}</p>
                          </div>
                          <Badge variant="outline">{detail.onboarding.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDateTime(detail.onboarding.createdAt)}
                        </div>
                      </Card>

                      <Card className="p-4 space-y-3">
                        <p className="font-medium">Provisioning</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Devices</p>
                            <p>
                              {detail.onboarding.deviceProvisioning.provisionNow
                                ? `${detail.onboarding.deviceProvisioning.numberOfDevices} ${
                                    detail.onboarding.deviceProvisioning.deviceManufacturer || ""
                                  }`
                                : "Skipped"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">SIMs</p>
                            <p>
                              {detail.onboarding.simAssignment.provisionNow
                                ? `${detail.onboarding.simAssignment.numberOfSims} ${
                                    detail.onboarding.simAssignment.carrier || ""
                                  }`
                                : "Skipped"}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-4 text-sm text-muted-foreground">
                      No onboarding record is available for this tenant.
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="billing" className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-6 pr-4">
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{PLAN_LABELS[detail.tenant.plan]} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          Plan code: {detail.tenant.planCode || "—"}
                        </p>
                      </div>
                      {getStatusBadge(detail.tenant.status)}
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Monthly Revenue</p>
                      <p className="font-medium">{formatCurrency(detail.tenant.monthlyRevenueNgn)}</p>
                    </div>
                  </Card>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-muted-foreground">Billing Contact</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{detail.tenant.billingEmail || detail.tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Last active {formatDate(detail.tenant.lastActiveAt)}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TenantDetailsSheet;
