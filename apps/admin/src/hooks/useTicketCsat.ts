import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export interface TicketCsat {
  id: string;
  ticket_id: string;
  tenant_id: string;
  org_id: string | null;
  submitted_by: string;
  submitted_by_name: string | null;
  rating: number;
  comment: string | null;
  would_recommend: boolean | null;
  created_at: string;
}

/**
 * Read + submit CSAT for a single ticket.
 * Returns existing rating if the current user already rated.
 */
export function useTicketCsat(ticketId: string | null) {
  const { user } = useAuthStore();
  const [csat, setCsat] = useState<TicketCsat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!ticketId || !user?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("support_ticket_csat")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("submitted_by", user.id)
      .maybeSingle();
    setCsat((data as TicketCsat | null) ?? null);
    setIsLoading(false);
  }, [ticketId, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (input: { rating: number; comment?: string; wouldRecommend?: boolean }) => {
      if (!ticketId || !user?.id) return false;
      if (input.rating < 1 || input.rating > 5) {
        toast.error("Please choose a rating between 1 and 5");
        return false;
      }
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase
          .from("support_ticket_csat")
          .insert({
            ticket_id: ticketId,
            tenant_id: user.tenantId || "",
            submitted_by: user.id,
            submitted_by_name: user.name,
            rating: input.rating,
            comment: input.comment?.trim() || null,
            would_recommend: input.wouldRecommend ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        setCsat(data as TicketCsat);
        toast.success("Thanks for your feedback!");
        return true;
      } catch (e: any) {
        console.error("CSAT submit failed", e);
        toast.error(e?.message || "Could not submit feedback");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [ticketId, user]
  );

  return { csat, isLoading, isSubmitting, submit, refresh };
}



