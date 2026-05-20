import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BundleCycle = "monthly" | "yearly";

export interface BundleCatalogItem {
  id: string;
  code: string;
  name: string;
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number;
  billing_cycle: BundleCycle;
  is_active: boolean;
}

export interface BundleAllocation {
  id: string;
  tenant_id: string;
  msisdn: string;
  bundle_code: string;
  data_mb_total: number;
  data_mb_used: number;
  status: string;
  expires_at: string;
  expiry_alert_7d_sent_at: string | null;
  expiry_alert_1d_sent_at: string | null;
  created_at: string;
}

export interface BundleTopupInput {
  tenant_id: string;
  org_id?: string | null;
  sim_id?: string | null;
  msisdn: string;
  bundle_code: string;
}

/* ── Catalog (read-only for tenants, writeable for platform) ── */
export function useBundleCatalog() {
  return useQuery({
    queryKey: ["bundle-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_bundles_catalog")
        .select("*")
        .order("billing_cycle", { ascending: true })
        .order("data_mb", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BundleCatalogItem[];
    },
  });
}

export function useUpsertBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Partial<BundleCatalogItem> & { code: string; name: string; data_mb: number; price_ngn: number; validity_days: number }) => {
      const { error } = await supabase.from("data_bundles_catalog").upsert([b], {
        onConflict: "code",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bundle-catalog"] });
      toast.success("Bundle saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleBundleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("data_bundles_catalog")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bundle-catalog"] }),
  });
}

/* ── Allocations (per tenant) ── */
export function useBundleAllocations(tenantId?: string) {
  return useQuery({
    queryKey: ["bundle-allocations", tenantId ?? "self"],
    queryFn: async () => {
      let q = supabase
        .from("data_bundle_allocations")
        .select("*")
        .order("expires_at", { ascending: true });
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BundleAllocation[];
    },
    enabled: tenantId !== undefined,
  });
}

/* ── Top-up: insert pending row + invoke pcrf-bridge ── */
export function useBundleTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BundleTopupInput) => {
      const { data: topup, error } = await supabase
        .from("data_bundle_topups")
        .insert({ ...input, amount_ngn: 0, status: "PENDING" })
        .select()
        .single();
      if (error) throw error;

      const { error: fnErr } = await supabase.functions.invoke("pcrf-bridge", {
        body: { topup_id: topup.id },
      });
      if (fnErr) throw fnErr;
      return topup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bundle-allocations"] });
      qc.invalidateQueries({ queryKey: ["bundle-topups"] });
      toast.success("Top-up requested");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBundleTopups(tenantId?: string) {
  return useQuery({
    queryKey: ["bundle-topups", tenantId ?? "self"],
    queryFn: async () => {
      let q = supabase
        .from("data_bundle_topups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: tenantId !== undefined,
  });
}

export function formatBundleSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}
