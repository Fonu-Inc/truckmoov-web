import * as JSSip from "jssip";
import moment from "moment";

// JsSIP internal types are not consistently exported, so we use `any` to avoid build errors

type RTCSession = any;

type OutgoingRequest = any;

type CallOptions = any;

type RTCSessionEvent = any;

export type ICallData = {
  name: string;
  number: string;
  status: string;
  direction: string;
  startedAt: number;
  active: boolean;
  recording: boolean;
};

export type ISipEvents = {
  onConnecting?: () => void;
  onConfirmed?: (callId: string) => void;
  onEnded?: () => void;
  onFailed?: () => void;
  onProgress?: () => void;
  onAccepted?: () => void;
  onRegistered?: () => void;
  onSessionCreated?: (session: RTCSession) => void;
};

let _ua: JSSip.UA = {} as any;
const REGISTRATION_RETRY_LIMIT = 5;
let registrationRetryCount = 0;
let registrationRetryTimer: ReturnType<typeof setTimeout> | null = null;

const state = {
  onCall: {} as Record<string, string>,
  sipCallSocket: null as any,
  status: null as string | null,
  calls: {} as { [x: string]: ICallData },
  number: null as string | null,
};

const config: Map<string, string> = new Map();
const userCreds = {
  extension: "",
  domain: "",
  destination: "",
  originUuid: "",
  originNumber: "",
  companyUuid: "",
};

export function mapCredentials(raw: any) {
  const cfg = raw?.clickToCall ?? raw ?? {};
  const extension = (cfg.extension ?? "").toString();
  const domain = cfg.domain ?? "";
  const password = cfg.password ?? "";
  const wssUrl = cfg.wss_url ?? cfg.wssUrl ?? cfg.wss ?? "";

  config.clear();
  config.set(
    "extension",
    extension ? `${extension}_web_sdk` : "",
  );
  config.set(
    "domain",
    domain,
  );
  config.set(
    "password",
    password,
  );
  config.set(
    "wss_url",
    wssUrl,
  );

  userCreds.extension = extension;
  userCreds.domain = domain;
  userCreds.destination = cfg.destination ?? "";
  userCreds.originUuid = cfg.originUuid ?? "";
  userCreds.originNumber = cfg.origin?.number ?? cfg.origin ?? "";
  userCreds.companyUuid = cfg.companyUuid ?? cfg.company_uuid ?? "";
}

function dispatch(action: {
  type: string;
  payload: any;
}) {
  switch (action.type) {
    case "SET_STATUS":
      state.status = action.payload;
      break;
    case "NEW_CALL":
      state.calls = action.payload.calls;
      break;
    case "UPDATE_CALL":
      state.calls = {
        ...state.calls,
        [action.payload.callId]: action.payload.status,
      };
      break;
  }
}

function registerUaEvents(
  ua: JSSip.UA,
  {
    onConnecting,
    onConfirmed,
    onEnded,
    onFailed,
    onProgress,
    onAccepted,
    onRegistered,
    onSessionCreated,
  }: ISipEvents,
) {
  ua.on(
    "connecting",
    () => {
      dispatch({
        type: "SET_STATUS",
        payload: "connecting",
      });
      onConnecting?.();
    },
  );
  ua.on(
    "connected",
    () => dispatch({
      type: "SET_STATUS",
      payload: "connected",
    }),
  );
  ua.on(
    "disconnected",
    () => dispatch({
      type: "SET_STATUS",
      payload: "disconnected",
    }),
  );
  ua.on(
    "registered",
    () => {
      registrationRetryCount = 0;
      registrationRetryTimer && clearTimeout(registrationRetryTimer);
      registrationRetryTimer = null;
      onRegistered?.();
      dispatch({
        type: "SET_STATUS",
        payload: "registered",
      });
    },
  );
  ua.on(
    "unregistered",
    () => dispatch({
      type: "SET_STATUS",
      payload: "unregistered",
    }),
  );
  ua.on(
    "registrationFailed",
    (err) => {
      dispatch({
        type: "SET_STATUS",
        payload: "registrationFailed",
      });
      console.error(
        "[FonuClickToCallSDK] - SIP registration failed event",
        err,
      );
      throw err;
    },
  );
  ua.on(
    "newRTCSession",
    (data: RTCSessionEvent) => {
      onSessionCreated?.(data.session);
      handleNewRTCSession(
        data,
        {
          onConnecting,
          onConfirmed,
          onEnded,
          onFailed,
          onProgress,
          onAccepted,
        },
      );
    },
  );
}

function handleNewRTCSession(
  {
    originator,
    session,
    request,
  }: RTCSessionEvent,
  {
    onConnecting,
    onConfirmed,
    onEnded,
    onFailed,
    onProgress,
    onAccepted,
  }: ISipEvents,
) {
  if (originator !== "local")
    return;
  const callID = (request as any as OutgoingRequest).call_id;
  const displayName = session.remote_identity.display_name || "Unknown";
  const number = session.remote_identity.uri.user || "Unknown";
  const newCall = {
    [callID]: {
      name: displayName,
      number,
      status: "connecting",
      direction: "outbound",
      startedAt: moment.utc().valueOf(),
      active: false,
      recording: false,
    },
  };
  dispatch({
    type: "NEW_CALL",
    payload: { calls: newCall },
  });
  handleSessionEvents(
    session,
    callID,
    {
      onConnecting,
      onConfirmed,
      onEnded,
      onFailed,
      onProgress,
      onAccepted,
    },
  );
}

function handleSessionEvents(
  session: RTCSession,
  callID: string,
  {
    onConnecting,
    onConfirmed,
    onEnded,
    onFailed,
    onProgress,
    onAccepted,
  }: ISipEvents,
) {
  const audioElement = new Audio();
  session.on(
    "connecting",
    () => {
      dispatch({
        type: "UPDATE_CALL",
        payload: {
          callId: callID,
          status: "connecting",
        },
      });
      onConnecting?.();
    },
  );
  session.on(
    "confirmed",
    () => {
      audioElement.srcObject = session.connection.getRemoteStreams()[0];
      audioElement.play();
      dispatch({
        type: "UPDATE_CALL",
        payload: {
          callId: callID,
          status: "connected",
        },
      });
      onConfirmed?.(callID);
    },
  );
  session.on(
    "progress",
    () => onProgress?.(),
  );
  session.on(
    "accepted",
    () => onAccepted?.(),
  );
  session.on(
    "ended",
    () => {
      dispatch({
        type: "UPDATE_CALL",
        payload: {
          callId: callID,
          status: "ended",
        },
      });
      onEnded?.();
    },
  );
  session.on(
    "failed",
    (err) => {
      dispatch({
        type: "UPDATE_CALL",
        payload: {
          callId: callID,
          status: "failed",
        },
      });
      console.error(
        "[FonuClickToCallSDK] - Call failed",
        err,
      );
      onFailed?.();
    },
  );
}

export function initSipConnection(events: ISipEvents) {
  if (!config || !config.size)
    throw new Error("FonuClickToCallSDK: missing SIP config");

  const wssUrl = config.get("wss_url") || "";
  const domain = config.get("domain") || "";
  const password = config.get("password") || "";
  const extension = config.get("extension") || "";

  if (!wssUrl || !domain || !password || !extension) {
    const err = new Error("FonuClickToCallSDK: incomplete SIP config");
    console.error(
      "[FonuClickToCallSDK] SIP config missing values",
      {
        wssUrl,
        domain,
        extension,
        passwordPresent: !!password,
      },
    );
    throw err;
  }

  try {
    registrationRetryCount = 0;
    registrationRetryTimer && clearTimeout(registrationRetryTimer);
    registrationRetryTimer = null;
    JSSip.debug.disable();
    const socket = new JSSip.WebSocketInterface(wssUrl);
    (socket as any).via_transport = "tcp";
    _ua = new JSSip.UA({
      sockets: [socket],
      uri: `sip:${extension}@${domain}`,
      password,
      session_timers: false,
      registrar_server: `sip:${domain}`,
    });
    _ua.start();
    registerUaEvents(
      _ua,
      events,
    );
  }
  catch (error) {
    console.error(
      "[FonuClickToCallSDK] - Error: SIP registration failed.",
      {
        wssUrl,
        domain,
        extension,
        passwordPresent: !!password,
        error,
      },
    );
    throw error;
  }
}

export function makeCall(displayName: string, customNumber?: string, customHeaders?: string[]) {
  if (!_ua || !config.size) {
    throw new Error("[FonuClickToCallSDK] - SIP not initialized.");
  }
  const callerId = (userCreds.originNumber || "").trim();
  if (!callerId) {
    throw new Error("[FonuClickToCallSDK] - Caller ID is required before initiating a call.");
  }
  let options: CallOptions = {
    mediaConstraints: {
      audio: true,
      video: false,
    },
    fromDisplayName: displayName,
    rtcOfferConstraints: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    },
  };
  const extraHeaders: string[] = [`X-Caller-ID: ${callerId}`];
  if (userCreds.originUuid)
    extraHeaders.push(`X-Caller-UUID: ${userCreds.originUuid}`);
  if (userCreds.companyUuid)
    extraHeaders.push(`X-Company-UUID: ${userCreds.companyUuid}`);
  if (Array.isArray(customHeaders) && customHeaders.length)
    extraHeaders.push(...customHeaders);
  if (extraHeaders.length) {
    options = {
      ...options,
      extraHeaders,
    };
  }
  _ua.call(
    customNumber || userCreds.destination,
    options,
  );
}

export function getFonuState() {
  return state;
}
