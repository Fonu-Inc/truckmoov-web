import type { MessagingConversation } from "@truckmoov/api/notification";
import {
  useEffect, useState,
} from "react";
import { windowSecondsLeft } from "./messagingLogic";

/**
 * Whether the 24-hour window is closed right now. The server only reports the
 * hours left when it last looked, so this counts down locally and flips the
 * conversation to locked at the moment it expires.
 */
export function useWindowLock(conversation: MessagingConversation) {
  const [
    reportedAt,
    setReportedAt,
  ] = useState(() => Date.now());
  const [
    now,
    setNow,
  ] = useState(() => Date.now());

  useEffect(
    () => {
      setReportedAt(Date.now());
      setNow(Date.now());
    },
    [
      conversation.is_locked,
      conversation.window_remaining_hours,
    ],
  );

  const secondsLeft = windowSecondsLeft(
    conversation,
    reportedAt,
    now,
  );
  const locked = conversation.is_locked || secondsLeft === 0;

  useEffect(
    () => {
      if (locked)
        return;
      const timer = window.setInterval(
        () => setNow(Date.now()),
        30_000,
      );
      return () => window.clearInterval(timer);
    },
    [locked],
  );

  return {
    locked, secondsLeft,
  };
}
