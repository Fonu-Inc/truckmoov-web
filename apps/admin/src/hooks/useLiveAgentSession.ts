import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export type LiveSessionStatus = "queued" | "assigned" | "active" | "ended" | "abandoned";

export interface LiveSession {
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
}

export interface LiveMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: "user" | "agent" | "system";
  message: string;
  created_at: string;
}

/**
 * Manages a single live-agent chat session for the current end-user.
 * Tracks queue position, assigned agent, and streams chat messages in realtime.
 */
export function useLiveAgentSession() {
  const { user } = useAuthStore();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Hydrate any existing active session for this user
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("support_live_sessions")
        .select("*")
        .eq("requester_id", user.id)
        .in("status", ["queued", "assigned", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setSession(data as LiveSession);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Realtime: track this session row + recompute queue position when other sessions change
  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase
      .channel(`live-session-${session.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_live_sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as LiveSession)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.id]);

  // Realtime messages
  useEffect(() => {
    if (!session?.id) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("support_live_messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data || []) as LiveMessage[]);
    })();

    const ch = supabase
      .channel(`live-msgs-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_live_messages", filter: `session_id=eq.${session.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as LiveMessage])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [session?.id]);

  // Compute queue position when the session is queued
  const refreshQueuePosition = useCallback(async () => {
    if (!session || session.status !== "queued") {
      setQueuePosition(null);
      return;
    }
    const { count } = await supabase
      .from("support_live_sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued")
      .lte("queued_at", session.queued_at);
    setQueuePosition(count ?? null);
  }, [session]);

  useEffect(() => {
    refreshQueuePosition();
    if (!session || session.status !== "queued") return;
    const ch = supabase
      .channel("live-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_live_sessions" },
        () => refreshQueuePosition()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, refreshQueuePosition]);

  const joinQueue = useCallback(
    async (opts: { topic?: string; contextSummary?: string }) => {
      if (!user?.id) {
        toast.error("Please sign in to talk to a live agent");
        return null;
      }
      setIsJoining(true);
      try {
        const { data, error } = await supabase
          .from("support_live_sessions")
          .insert({
            tenant_id: user.tenantId || "",
            requester_id: user.id,
            requester_name: user.name,
            requester_email: user.email,
            topic: opts.topic || null,
            context_summary: opts.contextSummary || null,
          })
          .select()
          .single();
        if (error) throw error;
        setSession(data as LiveSession);
        toast.success("You're in the queue", { description: "An agent will join shortly." });
        return data as LiveSession;
      } catch (e) {
        console.error("joinQueue failed", e);
        toast.error("Could not join the live queue");
        return null;
      } finally {
        setIsJoining(false);
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!session || !user?.id || !text.trim()) return;
      const { error } = await supabase.from("support_live_messages").insert({
        session_id: session.id,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: "user",
        message: text.trim(),
      });
      if (error) {
        console.error(error);
        toast.error("Message failed to send");
      }
    },
    [session, user]
  );

  const endSession = useCallback(
    async (reason = "ended_by_user") => {
      if (!session) return;
      const now = new Date().toISOString();
      const duration = session.started_at
        ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000)
        : null;
      await supabase
        .from("support_live_sessions")
        .update({ status: "ended", ended_at: now, ended_reason: reason, duration_seconds: duration })
        .eq("id", session.id);
      setSession(null);
      setMessages([]);
    },
    [session]
  );

  return { session, messages, queuePosition, isJoining, joinQueue, sendMessage, endSession };
}



