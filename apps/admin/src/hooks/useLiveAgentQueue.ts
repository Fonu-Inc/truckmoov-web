import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { LiveSession, LiveMessage } from './useLiveAgentSession';

/**
 * Platform-agent view of the live support queue.
 */
export function useLiveAgentQueue() {
  const [sessions] = useState<LiveSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages] = useState<LiveMessage[]>([]);
  const isLoading = false;

  const claim = useCallback(async (_sessionId: string) => {}, []);
  const sendMessage = useCallback(async (_text: string) => {}, []);
  const endSession = useCallback(async (_sessionId: string, _reason?: string) => {}, []);

  return {
    sessions,
    queuedCount: 0,
    activeSessionId,
    setActiveSessionId,
    messages,
    isLoading,
    claim,
    sendMessage,
    endSession,
    refresh: () => {},
  };
}
