import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { axiosInstance } from './axios-instance'
import { useAuthStore } from './auth-store'
import { IS_DEV, requireBackendUrl } from './env'

// Realtime gateway (TRU-FE-6 §1): one tenant-roomed, server-to-client socket.io
// connection shared by every screen that listens. The room comes from the token's
// verified claim — there is nothing to join or emit.
//
// Lifecycle: the first `acquireRealtimeSocket()` opens it, each caller gets a
// `release()`, and the last release removes every listener, disconnects and drops
// the auth subscription. Nothing survives an unmount or a logout.

export type RealtimeRefusedReason = 'origin_not_allowed' | 'capacity_reached' | 'unauthenticated' | 'scope_unavailable' | 'tenant_suspended' | 'app_check_failed'

export type RealtimeStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'connected' }
  | { state: 'disconnected' }
  | { state: 'refused', reason: RealtimeRefusedReason | string }

/** Socket origin; resolved on connect so importing this module never throws. */
const getOrigin = () => new URL(requireBackendUrl()).origin

let socket: Socket | null = null
let refCount = 0
let unsubscribeAuth: (() => void) | null = null
let retriedAuth = false
let status: RealtimeStatus = { state: 'idle' }
const statusListeners = new Set<() => void>()

function setStatus(next: RealtimeStatus) {
  status = next
  statusListeners.forEach(fn => fn())
}

function teardown() {
  unsubscribeAuth?.()
  unsubscribeAuth = null
  if (socket) {
    socket.removeAllListeners()
    socket.io.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  retriedAuth = false
  setStatus({ state: 'idle' })
}

function create(): Socket {
  const s = io(getOrigin(), {
    path: '/realtime/socket.io',
    transports: ['websocket'],
    // Handshake auth frame, never the query string: query strings land in proxy/access logs.
    // A callback so every (re)connect sends the current token, not the one we started with.
    auth: cb => cb({ token: useAuthStore.getState().accessToken ?? '' }),
  })

  s.on('connect', () => {
    retriedAuth = false
    setStatus({ state: 'connected' })
  })
  s.io.on('reconnect_attempt', () => setStatus({ state: 'connecting' }))
  // Any authed request runs the axios 401 → /auth/refresh flow; a new token then
  // triggers the auth-store subscription below, which reconnects. One try per connection.
  const refreshOnce = () => {
    if (retriedAuth)
      return null
    retriedAuth = true
    return axiosInstance.get('/auth/me').catch(() => {})
  }

  s.on('disconnect', (reason) => {
    // A refusal already set a more useful status; keep it.
    if (status.state === 'refused')
      return
    setStatus({ state: 'disconnected' })
    // socket.io never retries a server-initiated disconnect; the gateway sends one at
    // token expiry, so refresh the token and let the auth subscription reconnect.
    if (reason !== 'io server disconnect')
      return
    const token = useAuthStore.getState().accessToken
    void refreshOnce()?.then(() => {
      // The API still took the old token (clock skew), so nothing rotated: retry with it.
      if (socket === s && token && !s.connected &&useAuthStore.getState().accessToken === token)
        s.connect()
    })
  })
  s.on('refused', ({ reason }: { reason: RealtimeRefusedReason }) => {
    setStatus({ state: 'refused', reason })
    if (reason === 'unauthenticated')
      refreshOnce()
  })

  // Token rotated → reconnect so the auth callback sends the new one. Logged out → close.
  unsubscribeAuth = useAuthStore.subscribe((state, prev) => {
    if (state.accessToken === prev.accessToken)
      return
    if (!state.accessToken) {
      s.disconnect()
      setStatus({ state: 'disconnected' })
      return
    }
    s.disconnect().connect()
    setStatus({ state: 'connecting' })
  })

  setStatus({ state: 'connecting' })
  return s
}

/** Shared socket plus a `release()` that must be called exactly once (effect cleanup). */
export function acquireRealtimeSocket(): { socket: Socket, release: () => void } {
  if (!socket)
    socket = create()
  refCount += 1
  let released = false
  return {
    socket,
    release: () => {
      if (released)
        return
      released = true
      refCount -= 1
      if (refCount <= 0) {
        refCount = 0
        teardown()
      }
    },
  }
}

/** Current connection state + change subscription (for a useSyncExternalStore hook in the app). */
export function getRealtimeStatus(): RealtimeStatus {
  return status
}

export function subscribeRealtimeStatus(fn: () => void): () => void {
  statusListeners.add(fn)
  return () => {
    statusListeners.delete(fn)
  }
}

/** Test/debug hook: how many screens hold the socket and how many listeners an event has. */
export function realtimeDebugState(event?: string) {
  return {
    refCount,
    connected: socket?.connected ?? false,
    listeners: event && socket ? socket.listeners(event).length : undefined,
  }
}

// Dev-only handle for checking cleanup from the browser console / Playwright.
if (IS_DEV)
  (globalThis as { __realtimeDebug?: typeof realtimeDebugState }).__realtimeDebug = realtimeDebugState
