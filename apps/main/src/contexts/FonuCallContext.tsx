import { useQuery } from "@tanstack/react-query";
import { getClickToCallCredentialsQueryOptions } from "@truckmoov/api/auth";
import {
  createContext, useContext, useEffect, useMemo, useState,
} from "react";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  placeFonuCall, setupFonuVoice,
} from "@/services/fonuVoice";
// NOTE: JsSIP's published typings don't expose the internal RTCSession type consistently.
// We keep the session as `any` to avoid build breaks while still allowing runtime use.

type CallStatus = "idle" | "connecting" | "ringing" | "connected" | "ended" | "failed";

type FonuCallContextValue = {
  status: CallStatus;
  remoteNumber: string;

  session: any | null;
  startCall: (displayName: string, number: string, headers?: string[]) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  isMuted: boolean;
  isOnHold: boolean;
  durationSeconds: number;
};

const FonuCallContext = createContext<FonuCallContextValue | undefined>(undefined);

export function FonuCallProvider({ children }: { children: React.ReactNode }) {
  const [
    status,
    setStatus,
  ] = useState<CallStatus>("idle");
  const [
    remoteNumber,
    setRemoteNumber,
  ] = useState("");

  const [
    session,
    setSession,
  ] = useState<any | null>(null);
  const [
    isMuted,
    setIsMuted,
  ] = useState(false);
  const [
    isOnHold,
    setIsOnHold,
  ] = useState(false);
  const [
    callStart,
    setCallStart,
  ] = useState<number | null>(null);
  const [
    durationSeconds,
    setDurationSeconds,
  ] = useState(0);

  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { data: credentials } = useQuery({
    ...getClickToCallCredentialsQueryOptions(),
    enabled: isAuthenticated,
  });

  useEffect(
    () => {
      if (!credentials)
        return;
      setupFonuVoice(
        credentials,
        {
          onConnecting: () => setStatus("connecting"),
          onProgress: () => setStatus("ringing"),
          onAccepted: () => setStatus("connected"),
          onConfirmed: () => setStatus("connected"),
          onEnded: () => setStatus("ended"),
          onFailed: () => setStatus("failed"),
          onRegistered: () =>
            console.log("[FonuCall] registered: ready for calls"),

          onSessionCreated: (s: any) => {
            setSession(s);
            setIsMuted(false);
            setIsOnHold(false);
          },
        },
      ).catch((err) => {
        console.warn(
          "[FonuCall] init skipped",
          err?.message || err,
        );
      });
    },
    [credentials],
  );

  useEffect(
    () => {
    // Start timer on first connected transition
      if (status === "connected" && !callStart) {
        setCallStart(Date.now());
      }

      if (status !== "connected" || !callStart) {
        setDurationSeconds(0);
        return;
      }

      setDurationSeconds(Math.floor((Date.now() - callStart) / 1000));
      const interval = setInterval(
        () => {
          setDurationSeconds(Math.floor((Date.now() - callStart) / 1000));
        },
        1000,
      );

      return () => clearInterval(interval);
    },
    [
      status,
      callStart,
    ],
  );

  const startCall = async (displayName: string, number: string, headers?: string[]) => {
    setRemoteNumber(number);
    setStatus("connecting");
    setCallStart(null);
    await placeFonuCall(
      displayName,
      number,
      headers,
    );
  };

  const endCall = () => {
    session?.terminate();
    setStatus("ended");
    setCallStart(null);
    setDurationSeconds(0);
  };

  const toggleMute = () => {
    if (!session)
      return;
    if (session.isMuted()?.audio) {
      session.unmute();
      setIsMuted(false);
    }
    else {
      session.mute();
      setIsMuted(true);
    }
  };

  const toggleHold = () => {
    if (!session)
      return;
    if (session.isOnHold().local) {
      session.unhold();
      setIsOnHold(false);
    }
    else {
      session.hold();
      setIsOnHold(true);
    }
  };

  const value = useMemo(
    () => ({
      status,
      remoteNumber,
      session,
      startCall,
      endCall,
      toggleMute,
      toggleHold,
      isMuted,
      isOnHold,
      durationSeconds,
    }),
    [
      status,
      remoteNumber,
      session,
      isMuted,
      isOnHold,
      durationSeconds,
    ],
  );

  return <FonuCallContext.Provider value={value}>{children}</FonuCallContext.Provider>;
}

export function useFonuCall() {
  const ctx = useContext(FonuCallContext);
  if (!ctx)
    throw new Error("useFonuCall must be used within a FonuCallProvider");
  return ctx;
}
