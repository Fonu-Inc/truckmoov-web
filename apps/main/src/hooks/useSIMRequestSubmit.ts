import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useKYCVerification } from "@/hooks/useKYCVerification";
import { toast } from "sonner";

import { SIMRequestSubmitData } from "@/components/sims/SIMRequestFormDialog";

export function useSIMRequestSubmit() {
  const { user } = useAuthStore();
  const kycStatus = useKYCVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = async (data: SIMRequestSubmitData) => {
    setIsSubmitting(true);
    try {
      const tenantId = user?.tenantId;

      // Quota enforcement: requested SIMs + existing must not exceed tenant.sim_quota
      if (tenantId) {
        const [{ data: tRow }, { count: simCount }] = await Promise.all([
          supabase.from("tenants").select("sim_quota").eq("id", tenantId).single(),
          supabase.from("iot_sims").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        ]);
        const quota = (tRow as { sim_quota?: number } | null)?.sim_quota ?? null;
        if (quota !== null && quota !== undefined && (simCount ?? 0) + data.numberOfSims > quota) {
          toast.error("SIM quota would be exceeded", {
            description: `Your plan allows ${quota} SIM${quota === 1 ? "" : "s"}. You currently have ${simCount ?? 0} and requested ${data.numberOfSims}. Reduce the request or contact your platform admin to increase the quota.`,
            duration: 8000,
          });
          setIsSubmitting(false);
          return false;
        }
      }

      const autoApproved = kycStatus.isVerified;
      const hasDeviceMapping =
        data.deviceMappingEnabled &&
        data.deviceMappingData &&
        data.deviceMappingData.length > 0;

      const insertPayload = {
        tenant_id: user?.tenantId || "tenant-1",
        tenant_name: user?.name || "Fleet Company",
        request_type: "activation",
        number_of_sims: data.numberOfSims,
        requested_plan: `${data.numberOfSims} SIMs - IoT`,
        requested_data_limit_mb: data.dataLimitGb * 1024,
        preferred_operator: data.preferredOperator,
        use_case: data.useCase || "IoT Tracking",
        deployment_timeline: null,
        device_mapping_enabled: data.deviceMappingEnabled,
        device_mapping_data: data.deviceMappingData || [],
        notes: data.notes || null,
        requested_by: user?.id || null,
        requested_by_name: user?.name,
        priority: data.numberOfSims > 10 ? "high" : "normal",
        status: autoApproved ? "approved" : "pending",
        ...(autoApproved
          ? {
              reviewed_at: new Date().toISOString(),
              review_notes: "Auto-approved: tenant KYC verified",
            }
          : {}),
      };

      const { data: insertedRequest, error } = await supabase
        .from("sim_provisioning_requests")
        .insert(insertPayload as any)
        .select()
        .single();

      if (error) throw error;

      if (autoApproved && insertedRequest) {
        const quantity = data.numberOfSims;
        const activationMode = quantity > 1 ? "bulk" : "single";

        await supabase.from("sim_activation_batches").insert({
          request_id: insertedRequest.id,
          tenant_id: user?.tenantId || "tenant-1",
          tenant_name: user?.name || "Fleet Company",
          activation_mode: activationMode,
          quantity,
          operator: data.preferredOperator,
          data_limit_gb: data.dataLimitGb,
          requested_plan: `${quantity} SIMs - IoT`,
          device_mapping_data: data.deviceMappingData || [],
          status: "pending",
          created_by_name: "System (Auto-approved)",
          notes: data.notes || null,
        } as any);
      }

      if (autoApproved) {
        toast.success("SIM request auto-approved! ✅", {
          description: hasDeviceMapping
            ? "SIMs will be auto-assigned to your devices after activation."
            : "Your tenant is KYC-verified. SIM activation will begin shortly.",
        });
      } else {
        toast.success("SIM request submitted successfully", {
          description: "Platform admin will review your request shortly.",
        });
      }

      return true;
    } catch (error) {
      console.error("Error submitting SIM request:", error);
      toast.error("Failed to submit request", {
        description: "Please try again or contact support.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitRequest, isSubmitting, canRequestSIM: kycStatus.isVerified, kycStatus };
}
