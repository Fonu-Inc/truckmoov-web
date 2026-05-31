// Thin wrapper around fonu-sdk for SIP voice without rendering widgets.
// Sequence: fetch credentials -> map them -> start socket + SIP UA -> place calls.
// Env vars required (set in .env): VITE_FONU_COMPANY_UUID, VITE_FONU_API_KEY.

import {
  fetchUserCredentials,
} from 'fonu-sdk';
import {
  mapCredentials,
  initSipConnection,
  makeCall,
  getFonuState,
} from '@/services/fonuSipCore';

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

const COMPANY_UUID = import.meta.env.VITE_FONU_COMPANY_UUID;
const API_KEY = import.meta.env.VITE_FONU_API_KEY;

let initialized = false;

function ensureEnv() {
  if (!COMPANY_UUID || !API_KEY) {
    throw new Error('Fonu voice: missing VITE_FONU_COMPANY_UUID or VITE_FONU_API_KEY.');
  }
}

/**
 * Initialize SIP connectivity. Call once (e.g., on app start or when opening dialer).
 */
export async function setupFonuVoice(events: SipEventHandlers = {}) {
  ensureEnv();

  let creds: any;
  try {
    creds = await fetchUserCredentials(COMPANY_UUID, API_KEY);
  } catch (err) {
    console.error('[FonuClickToCallSDK] fetchUserCredentials failed', err);
    throw err;
  }

  if (!creds) throw new Error('Fonu voice: could not fetch user credentials.');

  mapCredentials(creds);
  console.log('[FonuClickToCallSDK] call prerequisites', {
    companyUuid: COMPANY_UUID,
    apiKeyPresent: !!API_KEY,
    clickToCall: {
      enabled: creds?.clickToCall?.enabled,
      extension: creds?.clickToCall?.extension,
      domain: creds?.clickToCall?.domain,
      wss_url: creds?.clickToCall?.wss_url,
      destination: creds?.clickToCall?.destination,
      origin: creds?.clickToCall?.origin,
      originUuid: creds?.clickToCall?.originUuid,
      originNumber: creds?.clickToCall?.origin?.number,
    },
  });
  try {
    initSipConnection(events);
  } catch (err) {
    console.error('[FonuClickToCallSDK] initSipConnection failed', err);
    throw err;
  }
  initialized = true;
}

/**
 * Place an outbound call. Make sure `setupFonuVoice` ran successfully first.
 */
export function placeFonuCall(displayName: string, number?: string, extraHeaders?: string[]) {
  if (!initialized) {
    throw new Error('Fonu voice: call setupFonuVoice() before placing calls.');
  }
  makeCall(displayName, number, extraHeaders);
}

export function fonuCallState() {
  return getFonuState();
}



