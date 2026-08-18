const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "backend_jwt";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token)
    headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  );
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body.message ?? body.error ?? msg;
    }
    catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204)
    return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(
    path,
    { method: "GET" },
  );
}
export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
export function apiPatch<T>(path: string, body: unknown) {
  return apiFetch<T>(
    path,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}
export function apiDelete<T = void>(path: string) {
  return apiFetch<T>(
    path,
    { method: "DELETE" },
  );
}
