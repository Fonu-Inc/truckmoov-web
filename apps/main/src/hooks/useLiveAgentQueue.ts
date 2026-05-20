import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { LiveSession, LiveMessage } from "./useLiveAgentSession";

/**
 * Platform-agent view of the live support queue.
 * Lists queued + active sessions and allows an agent to claim, message, and end them.
 */
export function useLiveAgentQueue() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("support_live_sessions")
      .select("*")
      .in("status", ["queued", "assigned", "active"])
      .order("queued_at", { ascending: true });
    setSessions((data || []) as LiveSession[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("agent-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_live_sessions" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  // Load + subscribe messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("support_live_messages")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data || []) as LiveMessage[]);
    })();
    const ch = supabase
      .channel(`agent-msgs-${activeSessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_live_messages", filter: `session_id=eq.${activeSessionId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as LiveMessage])
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeSessionId]);

  const claim = useCallback(
    async (sessionId: string) => {
      if (!user?.id) return;
      const session = sessions.find((s) => s.id === sessionId);
      const waitSeconds = session
        ? Math.round((Date.now() - new Date(session.queued_at).getTime()) / 1000)
        : null;
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("support_live_sessions")
        .update({
          status: "active",
          agent_id: user.id,
          agent_name: user.name,
          assigned_at: now,
          started_at: now,
          wait_seconds: waitSeconds,
        })
        .eq("id", sessionId);
      if (error) {
        toast.error("Could not claim session");
        return;
      }
      // Post a system message so the user sees who joined
      await supabase.from("support_live_messages").insert({
        session_id: sessionId,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: "system",
        message: `${user.name || "An agent"} joined the chat.`,
      });
      setActiveSessionId(sessionId);
    },
    [user, sessions]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeSessionId || !user?.id || !text.trim()) return;
      const { error } = await supabase.from("support_live_messages").insert({
        session_id: activeSessionId,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: "agent",
        message: text.trim(),
      });
      if (error) toast.error("Message failed to send");
    },
    [activeSessionId, user]
  );

  const endSession = useCallback(
    async (sessionId: string, reason = "ended_by_agent") => {
      const session = sessions.find((s) => s.id === sessionId);
      const duration = session?.started_at
        ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000)
        : null;
      await supabase
        .from("support_live_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          ended_reason: reason,
          duration_seconds: duration,
        })
        .eq("id", sessionId);
      if (activeSessionId === sessionId) setActiveSessionId(null);
      toast.success("Session ended");
    },
    [sessions, activeSessionId]
  );

  return {
    sessions,
    queuedCount: sessions.filter((s) => s.status === "queued").length,
    activeSessionId,
    setActiveSessionId,
    messages,
    isLoading,
    claim,
    sendMessage,
    endSession,
    refresh,
  };
}
