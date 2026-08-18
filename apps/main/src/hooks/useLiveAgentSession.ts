import {
  useCallback, useState,
} from "react";
import { useAuthStore } from "@/stores/authStore";

export type LiveSessionStatus = "queued" | "assigned" | "active" | "ended" | "abandoned";

export type LiveSession = {
  id: string;
  tenant_id: string;
  org_id: string | null;
  requester_id: string;
  requester_name: string | null;
  requester_email: string | null;
  topic: string | null;
  context_summary: string | null;
  status: LiveSessionStatus;
  agent_id: string | null;
  agent_name: string | null;
  ticket_id: string | null;
  queued_at: string;
  assigned_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  wait_seconds: number | null;
  duration_seconds: number | null;
  ended_reason: string | null;
};

export type LiveMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: "user" | "agent" | "system";
  message: string;
  created_at: string;
};

/**
 * Manages a single live-agent chat session for the current end-user.
 */
export function useLiveAgentSession() {
  const session: LiveSession | null = null;
  const messages: LiveMessage[] = [];
  const queuePosition: number | null = null;
  const isJoining = false;

  const joinQueue = useCallback(
    async (_opts: {
      topic?: string; contextSummary?: string;
    }) => null,
    [],
  );
  const sendMessage = useCallback(
    async (_text: string) => {},
    [],
  );
  const endSession = useCallback(
    async (_reason?: string) => {},
    [],
  );

  return {
    session, messages, queuePosition, isJoining, joinQueue, sendMessage, endSession,
  };
}
