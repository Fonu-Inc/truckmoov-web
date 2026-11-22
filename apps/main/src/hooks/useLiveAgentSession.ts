import type { SupportTicketCategory } from "@truckmoov/api/auth";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  getSupportTicketQueryOptions,
  getSupportTicketsQueryOptions,
  useAttachSupportTicketFiles,
  useCloseSupportTicket,
  useCreateSupportTicket,
  useReplySupportTicket,
} from "@truckmoov/api/auth";
import {
  useCallback, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useSupportTicketLiveUpdates } from "@/hooks/useSupportTicketLiveUpdates";

export type LiveSessionStatus = "waiting" | "connected" | "ended";

export type LiveSession = {
  ticketId: string;
  subject: string;
  status: LiveSessionStatus;
  agentName: string | null;
  startedAt: string;
  connectedAt: string | null;
};

export type LiveMessage = {
  id: string;
  role: "user" | "agent";
  senderName: string | null;
  message: string;
  createdAt: string;
  attachments: string[];
};

export type LiveChatTopic = {
  id: string;
  label: string;
};

/** Tickets raised from the chat widget carry this otherChannel so the widget can find them again. */
const LIVE_CHAT_CHANNEL = "live chat";
const ENDED_KEY = "support-chat:ended-ticket";
const ACTIVE_KEY = "support-chat:active-ticket";
const SEEN_KEY = "support-chat:last-seen-reply";
const ENDED_STATUSES = new Set([
  "resolved",
  "closed",
]);
const OPEN_STATUSES = "open,in_progress,waiting_on_tenant,escalated";

const TOPIC_CATEGORY: Record<string, SupportTicketCategory> = {
  activation: "onboarding",
  device: "device_tracking",
  sim: "sim_connectivity",
  whatsapp: "messaging",
  billing: "billing",
  account: "account_access",
};

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  }
  catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    }
    else {
      localStorage.setItem(
        key,
        value,
      );
    }
  }
  catch {}
}

function errorMessage(error: unknown, fallback: string) {
  return (error as { message?: string } | null)?.message || fallback;
}

/**
 * Live chat backed by a support ticket: joining raises a ticket, messages are its
 * public thread, and replies go back through the ticket reply endpoint.
 */
export function useLiveAgentSession({ open }: { open: boolean }) {
  const queryClient = useQueryClient();
  const userId = useAuthStore(s => s.user?.id);
  // Per user: tickets are shared account-wide, so another user's chat must not reopen here.
  const activeKey = `${ACTIVE_KEY}:${userId ?? ""}`;
  const [
    ticketId,
    setTicketId,
  ] = useState<string | null>(null);
  const [
    stored,
    setStored,
  ] = useState(() => ({
    key: activeKey,
    id: readStorage(activeKey),
  }));
  if (stored.key !== activeKey) {
    setStored({
      key: activeKey,
      id: readStorage(activeKey),
    });
  }
  const storedId = userId && stored.key === activeKey ? stored.id : null;
  const [
    endedId,
    setEndedId,
  ] = useState(() => readStorage(ENDED_KEY));
  const [
    lastSeenId,
    setLastSeenId,
  ] = useState(() => readStorage(SEEN_KEY));

  // Only when nothing is stored: the caller's newest open chat ticket.
  const list = useQuery({
    ...getSupportTicketsQueryOptions({
      params: {
        createdBy: "me",
        channel: LIVE_CHAT_CHANNEL,
        status: OPEN_STATUSES,
        limit: 1,
      },
    }),
    enabled: !!userId && !ticketId && !storedId,
  });
  const listedId = list.data?.data.tickets[0]?.id ?? null;
  const restoredId = storedId ?? (listedId !== endedId ? listedId : null);
  const activeId = ticketId ?? restoredId;

  // Agent replies arrive over the realtime socket; the slow poll only covers a dropped connection.
  useSupportTicketLiveUpdates(activeId);
  const detail = useQuery({
    ...getSupportTicketQueryOptions(activeId ?? ""),
    enabled: !!activeId,
    refetchInterval: open ? 30_000 : 120_000,
  });

  const ticket = detail.data?.data.ticket;
  // A stored chat that is gone or already over is forgotten, as the list lookup would skip it.
  if (!ticketId && storedId && activeId === storedId
    && ((detail.error as { statusCode?: number } | null)?.statusCode === 404 || (ticket && ENDED_STATUSES.has(ticket.status)))) {
    writeStorage(
      activeKey,
      null,
    );
    setStored({
      key: activeKey,
      id: null,
    });
  }
  const messages = useMemo<LiveMessage[]>(
    () => {
      const data = detail.data?.data;
      if (!data)
        return [];
      const filesFor = (messageId: string | null) => data.attachments
        .filter(a => a.messageId === messageId)
        .map(a => a.filename);
      return [
        {
          id: `${data.ticket.id}:description`,
          role: "user",
          senderName: null,
          message: data.ticket.description,
          createdAt: data.ticket.createdAt,
          attachments: filesFor(null),
        },
        ...data.messages
          .filter(m => !m.isInternal)
          .map(m => ({
            id: m.id,
            role: m.senderRole === "tenant" ? "user" as const : "agent" as const,
            senderName: m.senderName || null,
            message: m.message,
            createdAt: m.createdAt,
            attachments: filesFor(m.id),
          })),
      ];
    },
    [detail.data],
  );

  const agentMessages = messages.filter(m => m.role === "agent");
  const firstAgent = agentMessages[0];
  const lastAgent = agentMessages[agentMessages.length - 1];

  const session: LiveSession | null = ticket
    ? {
        ticketId: ticket.id,
        subject: ticket.subject,
        status: ENDED_STATUSES.has(ticket.status)
          ? "ended"
          : ticket.status === "in_progress" || firstAgent ? "connected" : "waiting",
        agentName: lastAgent?.senderName ?? null,
        startedAt: ticket.createdAt,
        connectedAt: firstAgent?.createdAt ?? null,
      }
    : null;

  const unread = !!lastAgent && lastAgent.id !== lastSeenId;
  const lastAgentId = lastAgent?.id;
  const markSeen = useCallback(
    () => {
      if (!lastAgentId || lastAgentId === lastSeenId)
        return;
      setLastSeenId(lastAgentId);
      writeStorage(
        SEEN_KEY,
        lastAgentId,
      );
    },
    [
      lastAgentId,
      lastSeenId,
    ],
  );

  const create = useCreateSupportTicket();
  const reply = useReplySupportTicket();
  const attach = useAttachSupportTicketFiles();
  const close = useCloseSupportTicket();

  const uploadFiles = async (id: string, files: File[], messageId?: string) => {
    if (files.length === 0)
      return;
    try {
      await attach.mutateAsync({
        id, data: files, messageId,
      });
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Your message was sent, but the attachments failed to upload",
      ));
    }
    await queryClient.invalidateQueries({ queryKey: getSupportTicketQueryOptions(id).queryKey });
  };

  const joinQueue = async (topic: LiveChatTopic | null, text: string, files: File[] = []) => {
    const trimmed = text.trim();
    // The backend needs at least 3 characters of description.
    const description = trimmed.length >= 3
      ? trimmed
      : [
          trimmed,
          files.length > 0 ? "(see attachments)" : "(sent from live chat)",
        ].filter(Boolean).join(" ");
    try {
      const res = await create.mutateAsync({
        data: {
          subject: topic ? `Live chat: ${topic.label}` : "Live chat",
          description,
          category: (topic && TOPIC_CATEGORY[topic.id]) || "other",
          channel: "other",
          otherChannel: LIVE_CHAT_CHANNEL,
        },
      });
      const id = res.data.id;
      setTicketId(id);
      writeStorage(
        activeKey,
        id,
      );
      setStored({
        key: activeKey,
        id,
      });
      toast.success("Chat started. A support agent will reply here.");
      await uploadFiles(
        id,
        files,
      );
      return true;
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Couldn't start the chat. Please try again.",
      ));
      return false;
    }
  };

  const sendMessage = async (text: string, files: File[] = []) => {
    if (!activeId)
      return false;
    try {
      const res = await reply.mutateAsync({
        id: activeId,
        data: { message: text.trim() || "Shared an attachment" },
      });
      const messageId = res.data?.message?.id;
      await uploadFiles(
        activeId,
        files,
        messageId,
      );
      return true;
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Message not sent. Please try again.",
      ));
      return false;
    }
  };

  const endSession = async () => {
    if (!activeId)
      return;
    if (ticket?.status === "resolved") {
      try {
        await close.mutateAsync({ id: activeId });
        toast.success("Chat closed");
      }
      catch (error) {
        toast.error(errorMessage(
          error,
          "Couldn't close the chat",
        ));
        return;
      }
    }
    else if (ticket && !ENDED_STATUSES.has(ticket.status)) {
      toast.info("Chat ended. Your ticket stays open until an agent closes it; follow it under Help → Tickets.");
    }
    setEndedId(activeId);
    writeStorage(
      ENDED_KEY,
      activeId,
    );
    writeStorage(
      activeKey,
      null,
    );
    setStored({
      key: activeKey,
      id: null,
    });
    setTicketId(null);
  };

  return {
    session,
    messages,
    unread,
    markSeen,
    isLoading: !!activeId && detail.isPending,
    isJoining: create.isPending,
    isSending: reply.isPending || attach.isPending,
    joinQueue,
    sendMessage,
    endSession,
  };
}
