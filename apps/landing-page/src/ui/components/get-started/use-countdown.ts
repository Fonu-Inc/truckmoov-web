import {
  useEffect, useState,
} from "react";

// Seconds-remaining countdown used for the OTP resend cooldown. Re-seeding
// (changing `seconds`) restarts it.
export function useCountdown(seconds: number) {
  const [
    remaining,
    setRemaining,
  ] = useState(seconds);

  useEffect(
    () => {
      setRemaining(seconds);
    },
    [seconds],
  );

  useEffect(
    () => {
      if (remaining <= 0)
        return;
      const id = window.setInterval(
        () => {
          setRemaining(prev => (prev <= 1 ? 0 : prev - 1));
        },
        1000,
      );
      return () => window.clearInterval(id);
    },
    [remaining],
  );

  return [
    remaining,
    setRemaining,
  ] as const;
}
