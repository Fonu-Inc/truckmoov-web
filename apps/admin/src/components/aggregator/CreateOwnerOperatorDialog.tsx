import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Phone, FileText, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { ORG_TYPES } from "@/types/orgRoles";

interface CreateOwnerOperatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateOwnerOperatorDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOwnerOperatorDialogProps) {
  const { getByOrgType } = useOrgContext();
  const aggregatorOrgs = getByOrgType(ORG_TYPES.AGGREGATOR);
  const aggregatorOrgId = aggregatorOrgs[0]?.orgId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    maxVehicles: "3",
    complianceNotes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    if (!aggregatorOrgId) {
      toast.error("No aggregator organization found for your account");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the aggregator's tenant_id
      const { data: aggOrg, error: aggError } = await supabase
        .from("organizations")
        .select("tenant_id")
        .eq("id", aggregatorOrgId)
        .single();

      if (aggError) throw aggError;

      // Create the Owner-Operator organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: form.name.trim(),
          organization_type: "OWNER_OPERATOR" as any,
          parent_organization_id: aggregatorOrgId,
          tenant_id: aggOrg.tenant_id,
          status: "ACTIVE" as any,
          max_vehicles: parseInt(form.maxVehicles, 10),
          metadata: {
            primary_contact: form.contactName.trim() || null,
            phone: form.phone.trim(),
            compliance_notes: form.complianceNotes.trim() || null,
          },
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create the org_relationship (Aggregator → Owner-Operator)
      const { error: relError } = await supabase
        .from("org_relationships")
        .insert({
          tenant_id: aggOrg.tenant_id,
          from_org_id: aggregatorOrgId,
          to_org_id: newOrg.id,
          relationship_type: "AGGREGATED_FLEET" as any,
          status: "ACTIVE" as any,
          start_date: new Date().toISOString().split("T")[0],
          permissions: {
            can_dispatch: true,
            can_view_assets: true,
            can_edit_assets: false,
          },
        });

      if (relError) throw relError;

      toast.success(`Owner-Operator "${form.name}" created successfully`);
      setForm({ name: "", contactName: "", phone: "", maxVehicles: "3", complianceNotes: "" });
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      console.error("Error creating owner-operator:", err);
      toast.error(err.message || "Failed to create owner-operator");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Add Owner-Operator
          </DialogTitle>
          <DialogDescription>
            Register a new owner-operator under your aggregator network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="oo-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Operator Name *
            </Label>
            <Input
              id="oo-name"
              placeholder="e.g. Adamu Trucks"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Primary Contact */}
          <div className="space-y-1.5">
            <Label htmlFor="oo-contact">Primary Contact</Label>
            <Input
              id="oo-contact"
              placeholder="Contact person name"
              value={form.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="oo-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone *
            </Label>
            <Input
              id="oo-phone"
              placeholder="+234..."
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          {/* Vehicle Cap */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Max Vehicles
            </Label>
            <Select value={form.maxVehicles} onValueChange={(v) => handleChange("maxVehicles", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} vehicle{n > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Owner-operators can manage up to 5 vehicles. Exceeding this requires upgrade to Fleet Provider.
            </p>
          </div>

          {/* Compliance Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="oo-compliance" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Compliance Notes
            </Label>
            <Textarea
              id="oo-compliance"
              placeholder="License details, insurance info, etc."
              rows={3}
              value={form.complianceNotes}
              onChange={(e) => handleChange("complianceNotes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Operator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



