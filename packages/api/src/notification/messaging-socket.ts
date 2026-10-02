import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import type {
  MarkReadAck,
  MessagingAck,
  MessagingConnectionFailure,
  MessagingServerEvents,
  SendMessageAck,
  SendMessageInput,
} from './messaging-types'

const ACK_TIMEOUT_MS = 10_000

export type PlatformMessagingSocketOptions = {
  baseUrl: string
  getToken: () => string | null | undefined
}

export type PlatformMessagingSocket = {
  on: <E extends keyof MessagingServerEvents>(event: E, handler: MessagingServerEvents[E]) => () => void
  onConnect: (handler: () => void) => () => void
  onDisconnect: (handler: () => void) => () => void
  onFailure: (handler: (reason: MessagingConnectionFailure) => void) => () => void
  isConnected: () => boolean
  /** Try again now. socket.io does not retry on its own once the server has refused the sign-in. */
  connect: () => void
  send: (input: SendMessageInput) => Promise<SendMessageAck>
  markRead: (conversationId: string) => Promise<MarkReadAck>
  close: () => void
}

const unavailable = (): { ok: false, error: { code: 'unavailable', message: 'Could not reach the server.' } } => ({
  ok: false,
  error: { code: 'unavailable', message: 'Could not reach the server.' },
})

function emitWithAck<T extends MessagingAck>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve(unavailable() as T)
      return
    }
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err: Error | null, res: T) => {
      resolve(err || !res ? (unavailable() as T) : res)
    })
  })
}

function failureOf(error: Error): MessagingConnectionFailure {
  if (error.message === 'unauthenticated' || error.message === 'forbidden')
    return error.message
  return 'unreachable'
}

function subscribe(socket: Socket, event: string, handler: (...args: never[]) => void) {
  socket.on(event, handler as never)
  return () => {
    socket.off(event, handler as never)
  }
}

export function createPlatformMessagingSocket({ baseUrl, getToken }: PlatformMessagingSocketOptions): PlatformMessagingSocket {
  const origin = new URL(baseUrl).origin
  const socket = io(`${origin}/platform-messaging`, {
    path: '/realtime/socket.io',
    auth: cb => cb({ token: getToken() ?? '' }),
    transports: ['websocket'],
    reconnection: true,
  })

  return {
    on: (event, handler) => subscribe(socket, event, handler),
    onConnect: handler => subscribe(socket, 'connect', handler),
    onDisconnect: handler => subscribe(socket, 'disconnect', handler),
    onFailure: handler => subscribe(socket, 'connect_error', (error: Error) => handler(failureOf(error))),
    isConnected: () => socket.connected,
    connect: () => {
      if (!socket.connected)
        socket.connect()
    },
    send: input => emitWithAck<SendMessageAck>(socket, 'message.send', input),
    markRead: conversation_id => emitWithAck<MarkReadAck>(socket, 'conversation.read', { conversation_id }),
    close: () => {
      socket.removeAllListeners()
      socket.disconnect()
    },
  }
}
