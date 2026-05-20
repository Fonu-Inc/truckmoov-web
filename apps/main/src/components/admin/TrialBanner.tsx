import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TrialStatus {
  status: string;
  trial_ends_at: string | null;
  days_remaining: number | null;
  trial_vehicle_cap: number | null;
  trial_sim_cap: number | null;
  is_expired: boolean;
}

/**
 * Shown to tenant admins while their tenant is on a Trial. Surfaces days
 * remaining and a clear CTA to add a payment method before expiry.
 */
export function TrialBanner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [trial, setTrial] = useState<TrialStatus | null>(null);

  useEffect(() => {
    const tenantId = (user as any)?.tenantId ?? (user as any)?.tenant_id;
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("v_tenant_trial_status")
        .select("status, trial_ends_at, days_remaining, trial_vehicle_cap, trial_sim_cap, is_expired")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (!cancelled && !error && data) setTrial(data as TrialStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!trial || trial.status !== "trial") return null;

  const days = trial.days_remaining ?? 0;
  const urgent = days <= 7;
  const Icon = urgent ? AlertTriangle : Sparkles;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        urgent ? "border-warning/40 bg-warning/10" : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${urgent ? "text-warning" : "text-primary"}`} />
        <div>
          <p className="text-sm font-medium">
            {days > 0
              ? `${days} day${days === 1 ? "" : "s"} left in your trial`
              : "Your trial has expired"}
          </p>
          <p className="text-xs text-muted-foreground">
            Trial limits: up to {trial.trial_vehicle_cap ?? 5} vehicles and {trial.trial_sim_cap ?? 5} SIMs. Add a payment method to keep your account active when the trial ends.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={urgent ? "default" : "outline"}
        onClick={() => navigate("/admin/billing")}
      >
        Add payment method
      </Button>
    </div>
  );
}
