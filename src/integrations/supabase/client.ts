import type { Database } from "./types";

type MockSession = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string | null };
};

type QueryResult<T> = Promise<{ data: T; error: null; count?: number }>;

type AuthCallback = (event: string, session: MockSession | null) => void;

const MOCK_SESSION_KEY = "truckmoov.mock.supabase.session";

const readSession = (): MockSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
};

const writeSession = (session: MockSession | null) => {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
};

let activeSession: MockSession | null = readSession();
const authListeners = new Set<AuthCallback>();

const notifyAuthListeners = (event: string, session: MockSession | null) => {
  authListeners.forEach((listener) => listener(event, session));
};

const fixtureRows: Record<string, unknown[]> = {
  feature_flags: [
    {
      feature_key: "enable_multi_stakeholder_model",
      scope: "platform",
      tenant_id: null,
      is_enabled: false,
    },
  ],
  organizations: [],
  user_org_memberships: [],
};

const clone = <T>(value: T): T => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

const defaultRowsFor = (table: string): unknown[] => clone(fixtureRows[table] ?? []);

const createQueryBuilder = (table: string, seed?: unknown): any => {
  let currentData: unknown = seed ?? defaultRowsFor(table);
  let forcedSingle = false;

  const builder: any = {};

  const passthroughMethods = [
    "eq",
    "neq",
    "is",
    "gt",
    "gte",
    "lt",
    "lte",
    "or",
    "not",
    "in",
    "contains",
    "overlaps",
    "filter",
    "match",
    "like",
    "ilike",
    "order",
    "range",
    "limit",
  ] as const;

  for (const method of passthroughMethods) {
    builder[method] = () => builder;
  }

  builder.select = () => builder;

  builder.insert = (payload: unknown) => {
    currentData = Array.isArray(payload) ? payload : [payload];
    return builder;
  };

  builder.update = (payload: unknown) => {
    const rows = Array.isArray(currentData) ? currentData : [currentData];
    currentData = rows.map((row) => ({ ...(row as Record<string, unknown>), ...(payload as Record<string, unknown>) }));
    return builder;
  };

  builder.delete = () => {
    currentData = [];
    return builder;
  };

  builder.upsert = (payload: unknown) => {
    currentData = Array.isArray(payload) ? payload : [payload];
    return builder;
  };

  builder.single = () => {
    forcedSingle = true;
    const rows = Array.isArray(currentData) ? currentData : [currentData];
    return Promise.resolve({ data: clone((rows[0] ?? null) as unknown), error: null });
  };

  builder.maybeSingle = builder.single;

  builder.then = (resolve: (value: { data: unknown; error: null; count?: number }) => unknown, reject?: (reason: unknown) => unknown) => {
    const rows = Array.isArray(currentData) ? currentData : [currentData];
    const response = forcedSingle
      ? { data: clone((rows[0] ?? null) as unknown), error: null, count: rows.length }
      : { data: clone(currentData), error: null, count: rows.length };

    return Promise.resolve(response).then(resolve, reject);
  };

  builder.catch = (reject: (reason: unknown) => unknown) => Promise.resolve(builder).catch(reject);

  return builder;
};

const createChannel = () => {
  const channel: any = {};

  channel.on = () => channel;
  channel.subscribe = (callback?: (status: string) => void) => {
    callback?.("SUBSCRIBED");
    return channel;
  };
  channel.unsubscribe = () => Promise.resolve("ok");

  return channel;
};

const mockAuth = {
  async getSession() {
    return { data: { session: activeSession }, error: null };
  },

  async getUser() {
    return { data: { user: activeSession?.user ?? null }, error: null };
  },

  async signInWithPassword({ email }: { email: string; password: string }) {
    activeSession = {
      access_token: `mock-token-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      user: {
        id: crypto.randomUUID(),
        email,
      },
    };
    writeSession(activeSession);
    notifyAuthListeners("SIGNED_IN", activeSession);

    return { data: { user: activeSession.user, session: activeSession }, error: null };
  },

  async signUp({ email }: { email: string; password: string; options?: Record<string, unknown> }) {
    activeSession = {
      access_token: `mock-token-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      user: {
        id: crypto.randomUUID(),
        email,
      },
    };
    writeSession(activeSession);
    notifyAuthListeners("SIGNED_IN", activeSession);

    return { data: { user: activeSession.user, session: activeSession }, error: null };
  },

  async signOut() {
    activeSession = null;
    writeSession(null);
    notifyAuthListeners("SIGNED_OUT", null);
    return { error: null };
  },

  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },
};

const mockFunctions = {
  async invoke(_name: string, _payload?: unknown) {
    return {
      data: {
        success: true,
        message: "Mock function response",
        data: [],
      },
      error: null,
    };
  },
};

const mockStorageBucket = {
  async upload(path: string) {
    return { data: { path }, error: null };
  },

  async download() {
    return { data: new Blob(["mock-file"]), error: null };
  },

  getPublicUrl(path: string) {
    return { data: { publicUrl: `https://mock.storage.local/${path}` } };
  },

  async createSignedUrl(path: string) {
    return { data: { signedUrl: `https://mock.storage.local/signed/${path}` }, error: null };
  },

  async remove() {
    return { data: [], error: null };
  },

  async list() {
    return { data: [], error: null };
  },
};

const mockStorage = {
  from: () => mockStorageBucket,
};

const mockRpc = async (name: string): QueryResult<unknown> => {
  if (name === "get_wallet_balance") {
    return Promise.resolve({
      data: {
        balance: 2500000,
        credit_enabled: true,
        credit_limit: 5000000,
        low_balance_threshold: 500000,
      },
      error: null,
    });
  }

  return Promise.resolve({ data: [], error: null });
};

// This mock client keeps Fleetflow UI functional without external dependencies.
export const supabase = {
  auth: mockAuth,
  functions: mockFunctions,
  storage: mockStorage,
  from: (table: string) => createQueryBuilder(table),
  rpc: (name: string, _args?: unknown) => mockRpc(name),
  channel: (_name: string) => createChannel(),
  removeChannel: async (_channel: unknown) => ({ data: null, error: null }),
} as any;

export type { Database };
