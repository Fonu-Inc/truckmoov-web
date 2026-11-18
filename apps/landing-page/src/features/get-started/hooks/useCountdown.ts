import {
  useEffect,
  useState,
} from "react";

// Seconds-remaining countdown used for the OTP resend cooldown. Re-seeding
// (changing `seconds`) restarts it.
export function useCountdown(seconds: number) {
  const [
    remaining,
    setRemaining,
  ] = useState(seconds);
  const [
    seed,
    setSeed,
  ] = useState(seconds);

  // A new seed restarts the countdown during render (no extra effect pass).
  if (seconds !== seed) {
    setSeed(seconds);
    setRemaining(seconds);
  }

  useEffect(
    () => {
      if (remaining <= 0)
        return;
      const id = window.setTimeout(
        () => {
          setRemaining(prev => (prev <= 1 ? 0 : prev - 1));
        },
        1000,
      );
      return () => window.clearTimeout(id);
    },
    [remaining],
  );

  return [
    remaining,
    setRemaining,
  ] as const;
}
