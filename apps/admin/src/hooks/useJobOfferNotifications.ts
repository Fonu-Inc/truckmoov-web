import { useEffect, useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { filterValidUuids } from "@/lib/uuidUtils";
import { toast } from "sonner";

/**
 * Subscribes to realtime job_offers inserts targeting the user's org(s).
 * Returns pending offer count for sidebar badge and provides notifications.
 */
export function useJobOfferNotifications() {
  const { orgIds: rawOrgIds } = useOrgContext();
  // Strip demo/non-UUID placeholders so .in('target_org_id', ...) doesn't 400.
  const orgIds = filterValidUuids(rawOrgIds);
  const [pendingCount, setPendingCount] = useState(0);
  const orgIdsRef = useRef(orgIds);
  orgIdsRef.current = orgIds;

  // Fetch initial pending count
  useEffect(() => {
    if (orgIds.length === 0) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from("job_offers")
        .select("id", { count: "exact", head: true })
        .in("target_org_id", orgIds)
        .eq("status", "PENDING");
      setPendingCount(count ?? 0);
    };

    fetchCount();
  }, [orgIds]);

  // Realtime subscription for new offers
  useEffect(() => {
    if (orgIds.length === 0) return;

    const channel = supabase
      .channel("oo-job-offer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_offers",
        },
        (payload) => {
          const newOffer = payload.new as any;
          // Check if this offer targets one of the user's orgs
          if (orgIdsRef.current.includes(newOffer.target_org_id)) {
            setPendingCount((prev) => prev + 1);
            toast.info("📦 New Job Offer", {
              description: "You have a new job offer waiting for review.",
              action: {
                label: "View",
                onClick: () => {
                  window.location.href = "/admin/job-offers";
                },
              },
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_offers",
        },
        (payload) => {
          const updated = payload.new as any;
          if (orgIdsRef.current.includes(updated.target_org_id) && updated.status !== "PENDING") {
            setPendingCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgIds]);

  const resetCount = useCallback(() => setPendingCount(0), []);

  return { pendingCount, resetCount };
}



