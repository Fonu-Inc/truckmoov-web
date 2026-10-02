import { useCallback, useState } from "react";

const APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;
const CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID as string | undefined;
const GRAPH_VERSION = (import.meta.env.VITE_META_GRAPH_VERSION as string | undefined) ?? "v23.0";

const SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
const META_ORIGINS = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
]);
const SESSION_WAIT_MS = 20_000;

type LoginResponse = { authResponse?: { code?: string } | null };

type FacebookSdk = {
  init: (options: Record<string, unknown>) => void;
  login: (callback: (response: LoginResponse) => void, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

export type EmbeddedSignupResult = {
  code: string;
  /** Absent when Meta finished only the business account; the server then finds the number. */
  phoneNumberId?: string;
  /** Absent when Meta never sent the account details; the server reads it off the token. */
  businessAccountId?: string;
  /** The number stays on the WhatsApp Business app, so it is not registered for the Cloud API. */
  coexistence: boolean;
};

export class EmbeddedSignupCancelled extends Error {
  constructor(readonly step?: string) {
    super("WhatsApp signup was cancelled");
    this.name = "EmbeddedSignupCancelled";
  }
}

export class EmbeddedSignupFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddedSignupFailed";
  }
}

type SignupMessage = {
  type?: string;
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    current_step?: string;
    error_message?: string;
  };
};

type SignupSession = Pick<EmbeddedSignupResult, "phoneNumberId" | "businessAccountId" | "coexistence">;

let sdkLoading: Promise<FacebookSdk> | null = null;

function loadSdk(appId: string): Promise<FacebookSdk> {
  if (window.FB)
    return Promise.resolve(window.FB);
  sdkLoading ??= new Promise<FacebookSdk>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({
        appId,
        autoLogAppEvents: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve(window.FB!);
    };
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => {
      sdkLoading = null;
      reject(new Error("Couldn't load Meta's signup. Check your connection or content blocker and try again."));
    };
    document.body.appendChild(script);
  });
  return sdkLoading;
}

function parseSignupMessage(event: MessageEvent): SignupMessage | null {
  if (!META_ORIGINS.has(event.origin))
    return null;
  try {
    const data: SignupMessage = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    return data?.type === "WA_EMBEDDED_SIGNUP" ? data : null;
  }
  catch {
    return null;
  }
}

function sessionFrom(message: SignupMessage): SignupSession | null {
  const { event, data } = message;
  if (event === "FINISH" && data?.waba_id)
    return { phoneNumberId: data.phone_number_id, businessAccountId: data.waba_id, coexistence: false };
  if (event === "FINISH_ONLY_WABA" && data?.waba_id)
    return { businessAccountId: data.waba_id, coexistence: false };
  if (event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" && data?.waba_id)
    return { phoneNumberId: data.phone_number_id, businessAccountId: data.waba_id, coexistence: true };
  return null;
}

function failureFrom(message: SignupMessage): Error | null {
  const { event, data } = message;
  if (event === "ERROR" || (event === "CANCEL" && data?.error_message))
    return new EmbeddedSignupFailed(data?.error_message || "Meta reported an error during signup.");
  if (event === "CANCEL")
    return new EmbeddedSignupCancelled(data?.current_step);
  return null;
}

/**
 * Runs Meta's WhatsApp embedded signup. The popup answers twice: the login
 * callback carries the one-time code, and a window message carries which
 * WhatsApp Business account and phone number the person chose. When the
 * message never arrives the code is still sent: the server reads the account
 * off the token it grants.
 */
function runSignup(sdk: FacebookSdk, configId: string): Promise<EmbeddedSignupResult> {
  return new Promise((resolve, reject) => {
    let code: string | null = null;
    let session: SignupSession | null = null;
    let waiting: ReturnType<typeof setTimeout> | null = null;

    const finish = (outcome: () => void) => {
      window.removeEventListener("message", onMessage);
      if (waiting)
        clearTimeout(waiting);
      outcome();
    };

    const settle = () => {
      if (!code)
        return;
      if (session) {
        const done: EmbeddedSignupResult = { code, ...session };
        finish(() => resolve(done));
      }
      else if (!waiting) {
        waiting = setTimeout(
          () => finish(() => resolve({ code: code!, coexistence: false })),
          SESSION_WAIT_MS,
        );
      }
    };

    function onMessage(event: MessageEvent) {
      const message = parseSignupMessage(event);
      if (!message)
        return;
      const found = sessionFrom(message);
      if (found) {
        session = found;
        settle();
        return;
      }
      const failure = failureFrom(message);
      if (failure)
        finish(() => reject(failure));
    }

    window.addEventListener("message", onMessage);
    sdk.login(
      (response) => {
        code = response.authResponse?.code ?? null;
        if (code)
          settle();
        else
          finish(() => reject(new EmbeddedSignupCancelled()));
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: "3",
          version: "v4",
        },
      },
    );
  });
}

export function useMetaEmbeddedSignup() {
  const [
    launching,
    setLaunching,
  ] = useState(false);
  const configured = Boolean(APP_ID && CONFIG_ID);

  const launch = useCallback(
    async () => {
      if (!APP_ID || !CONFIG_ID)
        throw new Error("WhatsApp signup is not configured: set VITE_META_APP_ID and VITE_META_CONFIG_ID.");
      setLaunching(true);
      try {
        return await runSignup(
          await loadSdk(APP_ID),
          CONFIG_ID,
        );
      }
      finally {
        setLaunching(false);
      }
    },
    [],
  );

  return {
    configured,
    launching,
    launch,
  };
}
