import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketMessagesQueryOptions,
  useCreateSupportTicketMessage,
} from "@truckmoov/api/auth";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";

/** Messages + composer state for one ticket (fleetflow's `useSupportMessages`). */
export function useTicketConversation(ticketId: string | null) {
  const myId = useAuthStore(state => state.user?.id);
  const messagesQuery = useQuery({
    ...getSupportTicketMessagesQueryOptions(ticketId ?? ""),
    enabled: !!ticketId,
  });
  const sendMutation = useCreateSupportTicketMessage();
  const [
    newMessage,
    setNewMessage,
  ] = useState("");
  const [
    isInternal,
    setIsInternal,
  ] = useState(false);

  const handleSend = () => {
    if (!ticketId || !newMessage.trim())
      return;
    sendMutation.mutate(
      {
        id: ticketId,
        data: {
          message: newMessage.trim(),
          isInternal,
        },
      },
      {
        onSuccess: () => {
          setNewMessage("");
          setIsInternal(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return {
    myId,
    messages: messagesQuery.data?.data?.messages ?? [],
    isLoading: messagesQuery.isLoading,
    newMessage,
    setNewMessage,
    isInternal,
    setIsInternal,
    isSending: sendMutation.isPending,
    handleSend,
  };
}
