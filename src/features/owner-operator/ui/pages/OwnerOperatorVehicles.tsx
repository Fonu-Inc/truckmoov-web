import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Truck, ChevronRight, Plus, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useOwnerOperatorVehicleCap } from "@/hooks/useOwnerOperatorVehicleCap";
import { useMemo, useState } from "react";
import { VehicleFormDialog } from "@/components/fleet/VehicleFormDialog";
import { UpgradeRequestDialog } from "@/components/owner-operator/UpgradeRequestDialog";
import { toast } from "sonner";

export default function OwnerOperatorVehicles() {
  const navigate = useNavigate();
  const orgCtx = useOrgContext();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const ownerOrg = useMemo(
    () => orgCtx.getByOrgType("OWNER_OPERATOR")[0],
    [orgCtx]
  );

  const { data: vehicleCap } = useOwnerOperatorVehicleCap(ownerOrg?.orgId);

  // Get tenant_id from the organization
  const { data: orgData } = useQuery({
    queryKey: ["oo-org-detail", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("tenant_id")
        .eq("id", ownerOrg!.orgId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ownerOrg?.orgId,
  });

  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ["oo-vehicles-list", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration_number, make, model, year, status, current_mileage, capacity")
        .eq("owning_org_id", ownerOrg!.orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  const isAtCap = vehicleCap?.isAtCap ?? false;

  const handleAddVehicle = async (data: any) => {
    if (!ownerOrg) return;
    const { error } = await supabase.from("vehicles").insert({
      registration_number: data.registrationNumber,
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: data.year,
      type: data.type,
      capacity: data.capacity,
      owning_org_id: ownerOrg.orgId,
      tenant_id: orgData?.tenant_id || "",
      status: "active",
    });
    if (error) {
      if (error.message?.includes("Vehicle cap reached")) {
        toast.error("Vehicle cap reached. Request an upgrade to add more vehicles.");
      } else {
        toast.error(error.message || "Failed to add vehicle");
      }
      return;
    }
    toast.success("Vehicle added successfully");
    setShowAddDialog(false);
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Vehicles" subtitle="View and manage your trucks">
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Vehicles" subtitle="View and manage your trucks">
      <div className="space-y-4">
        {/* Vehicle Cap Progress */}
        {vehicleCap && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Vehicles: {vehicleCap.currentCount} / {vehicleCap.maxVehicles}
              </span>
              <span className="text-muted-foreground">
                {vehicleCap.remaining} slot{vehicleCap.remaining !== 1 ? "s" : ""} remaining
              </span>
            </div>
            <Progress value={(vehicleCap.currentCount / vehicleCap.maxVehicles) * 100} className="h-2" />
            {isAtCap && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Vehicle cap reached. You cannot add more vehicles.</span>
                  <Button variant="outline" size="sm" className="ml-4 shrink-0" onClick={() => setShowUpgradeDialog(true)}>
                    <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                    Request Upgrade
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5 text-primary" />
                Vehicles ({vehicles.length})
              </CardTitle>
              <Button
                size="sm"
                disabled={isAtCap}
                onClick={() => setShowAddDialog(true)}
                title={isAtCap ? "Vehicle cap reached – request an upgrade" : "Add a new vehicle"}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No vehicles registered"
                description="Add your first truck to get started."
              />
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/30 cursor-pointer"
                    onClick={() => navigate(`/owner-operator/vehicle/${v.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{v.registration_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {v.make} {v.model} · {v.year || "—"}
                        {v.current_mileage ? ` · ${v.current_mileage.toLocaleString()} km` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={v.status === "active" ? "default" : "secondary"}>
                        {v.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <VehicleFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddVehicle}
        title="Add Vehicle"
      />

      {ownerOrg && vehicleCap && (
        <UpgradeRequestDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          orgId={ownerOrg.orgId}
          tenantId={orgData?.tenant_id || ""}
          currentVehicleCount={vehicleCap.currentCount}
          onSubmitted={() => setShowUpgradeDialog(false)}
        />
      )}
    </DashboardLayout>
  );
}
