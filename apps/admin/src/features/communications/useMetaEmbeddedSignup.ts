import { useCallback, useState } from "react";

const APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;
const CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID as string | undefined;
const GRAPH_VERSION = (import.meta.env.VITE_META_GRAPH_VERSION as string | undefined) ?? "v21.0";

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
  phoneNumberId: string;
  businessAccountId: string;
};

export class EmbeddedSignupCancelled extends Error {
  constructor() {
    super("WhatsApp signup was cancelled");
    this.name = "EmbeddedSignupCancelled";
  }
}

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

/**
 * Runs Meta's WhatsApp embedded signup. The popup answers twice: the login
 * callback carries the one-time code, and a window message carries which
 * WhatsApp Business account and phone number the person chose. Both are needed
 * before the server can link the number.
 */
function runSignup(sdk: FacebookSdk, configId: string): Promise<EmbeddedSignupResult> {
  return new Promise((resolve, reject) => {
    let code: string | null = null;
    let session: { phoneNumberId: string; businessAccountId: string } | null = null;
    let waiting: ReturnType<typeof setTimeout> | null = null;

    const finish = (outcome: () => void) => {
      window.removeEventListener("message", onMessage);
      if (waiting)
        clearTimeout(waiting);
      outcome();
    };

    const settle = () => {
      if (code && session) {
        const done = {
          code,
          ...session,
        };
        finish(() => resolve(done));
      }
      else if (code && !waiting) {
        waiting = setTimeout(
          () => finish(() => reject(new Error("Meta did not return the WhatsApp account details. Try again."))),
          SESSION_WAIT_MS,
        );
      }
    };

    function onMessage(event: MessageEvent) {
      if (!META_ORIGINS.has(event.origin))
        return;
      let data: { type?: string; event?: string; data?: { phone_number_id?: string; waba_id?: string } } | null = null;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      }
      catch {
        return;
      }
      if (data?.type !== "WA_EMBEDDED_SIGNUP")
        return;
      if (data.event === "FINISH" && data.data?.phone_number_id && data.data.waba_id) {
        session = {
          phoneNumberId: data.data.phone_number_id,
          businessAccountId: data.data.waba_id,
        };
        settle();
      }
      else if (data.event === "CANCEL") {
        finish(() => reject(new EmbeddedSignupCancelled()));
      }
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
