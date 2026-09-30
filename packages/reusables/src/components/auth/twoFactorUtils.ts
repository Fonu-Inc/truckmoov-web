import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * TRU-FE-23 — after three wrong codes the account's code step is paused: 429 with
 * `retryAfterSeconds`, and every code is refused until it runs out, a correct one included.
 * The per-IP login limit is also a 429 but has no `retryAfterSeconds`, which is how the two differ.
 */
export function cooldownSeconds(error: ServerErrorResponse): number | null {
  return error.statusCode === 429 && typeof error.retryAfterSeconds === "number"
    ? error.retryAfterSeconds
    : null;
}

/** Seconds left on a server-imposed wait; `start(n)` begins a new countdown. */
export function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0)
      return;
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return {
    secondsLeft,
    start: (seconds: number) => setSecondsLeft(Math.max(0, Math.ceil(seconds))),
  };
}

export async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
    return true;
  }
  catch {
    toast.error("Could not copy — the clipboard is not available.");
    return false;
  }
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
