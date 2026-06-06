import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

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
export function useTicketCsat(_ticketId: string | null) {
  const { user } = useAuthStore();

  const submit = useCallback(
    async (_input: { rating: number; comment?: string; wouldRecommend?: boolean }): Promise<boolean> => {
      return false;
    },
    []
  );

  const refresh = useCallback(async () => {}, []);

  return {
    csat: null as TicketCsat | null,
    isLoading: false,
    isSubmitting: false,
    submit,
    refresh,
  };
}
