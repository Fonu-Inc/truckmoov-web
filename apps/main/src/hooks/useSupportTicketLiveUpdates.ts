import { useQueryClient } from "@tanstack/react-query";
import { AUTH_QUERY_KEY } from "@truckmoov/api/auth";
import { acquireRealtimeSocket } from "@truckmoov/api/lib/realtime-socket";
import { useEffect } from "react";

/** Socket events the realtime gateway forwards from tm.<tenant>.support_ticket.*. */
export const SUPPORT_TICKET_SOCKET_EVENTS = [
  "support_ticket.raised",
  "support_ticket.replied",
  "support_ticket.customer_replied",
  "support_ticket.status_changed",
] as const;

type SupportTicketEvent = {
  ticketId?: string; ticket_id?: string;
};

/**
 * Keeps the ticket list, the summary cards and any open ticket current while
 * support (or a colleague on the same account) acts on a ticket. `ticketId`
 * is the ticket on screen, refreshed on every event.
 */
export function useSupportTicketLiveUpdates(ticketId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(
    () => {
      const {
        socket, release,
      } = acquireRealtimeSocket();
      const onEvent = (payload: SupportTicketEvent = {}) => {
        void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTickets() });
        void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicketsSummary });
        const ids = new Set([
          payload.ticketId ?? payload.ticket_id,
          ticketId,
        ].filter((id): id is string => !!id));
        ids.forEach((id) => {
          void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicket(id) });
          void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicketCsat(id) });
        });
      };
      SUPPORT_TICKET_SOCKET_EVENTS.forEach(event => socket.on(
        event,
        onEvent,
      ));
      return () => {
        SUPPORT_TICKET_SOCKET_EVENTS.forEach(event => socket.off(
          event,
          onEvent,
        ));
        release();
      };
    },
    [
      queryClient,
      ticketId,
    ],
  );
}
