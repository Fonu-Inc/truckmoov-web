// Thin wrapper around the SIP core for voice without rendering widgets.
// Credentials come from the backend (GET /auth/telephony/click-to-call-credentials).

import type { ClickToCallCredentials } from "@truckmoov/api/auth";
import {
  getFonuState,
  initSipConnection,
  makeCall,
  mapCredentials,
} from "@/services/fonuSipCore";

type SipEventHandlers = {
  onConnecting?: () => void;
  onConfirmed?: (callId: string) => void;
  onEnded?: () => void;
  onFailed?: () => void;
  onProgress?: () => void;
  onAccepted?: () => void;
  onRegistered?: () => void;
  onSessionCreated?: (session: any) => void;
};

let initialized = false;

/**
 * Initialize SIP connectivity. Call once (e.g., on app start or when opening dialer).
 */
export async function setupFonuVoice(creds: ClickToCallCredentials, events: SipEventHandlers = {}) {
  mapCredentials(creds);
  try {
    initSipConnection(events);
  }
  catch (err) {
    console.error(
      "[FonuClickToCallSDK] initSipConnection failed",
      err,
    );
    throw err;
  }
  initialized = true;
}

/**
 * Place an outbound call. Make sure `setupFonuVoice` ran successfully first.
 */
export function placeFonuCall(displayName: string, number?: string, extraHeaders?: string[]) {
  if (!initialized) {
    throw new Error("Fonu voice: call setupFonuVoice() before placing calls.");
  }
  makeCall(
    displayName,
    number,
    extraHeaders,
  );
}

export function fonuCallState() {
  return getFonuState();
}
