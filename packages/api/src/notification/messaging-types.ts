export type MessagingConversation = {
  id: string
  driver_name: string | null
  driver_phone: string
  last_message_preview: string
  last_message_at: string
  last_message_direction: 'inbound' | 'outbound'
  unread_count: number
  is_locked: boolean
  window_remaining_hours: number | null
}

export type MessagingMessageStatus = 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessagingErrorCode =
  | 'invalid_payload'
  | 'unauthenticated'
  | 'forbidden'
  | 'rate_limited'
  | 'conversation_not_found'
  | 'window_locked'
  | 'send_failed'
  | 'unavailable'

export type MessagingError = { code: MessagingErrorCode | string, message: string }

export type MessagingMessage = {
  id: string
  client_message_id: string | null
  direction: 'inbound' | 'outbound'
  status: MessagingMessageStatus
  text: string | null
  message_type: 'text' | 'other'
  created_at: string
  error?: MessagingError
}

export type MessagingConversationPage = {
  items: MessagingConversation[]
  next_cursor: string | null
}

export type MessagingMessagePage = {
  items: MessagingMessage[]
  next_before: string | null
}

export type MessagingConversationsQuery = {
  cursor?: string
  limit?: number
  query?: string
  state?: 'all' | 'unread'
}

export type MessagingMessagesQuery = {
  conversationId: string
  before?: string
  limit?: number
}

export type MessageCreatedEvent = { conversation_id: string, message: MessagingMessage }

export type MessageStatusEvent = {
  conversation_id: string
  message_id: string
  client_message_id?: string
  status: Exclude<MessagingMessageStatus, 'received'>
  error?: MessagingError
}

export type ConversationUpdatedEvent = { conversation: MessagingConversation }

export type MessagingServerEvents = {
  'message.created': (event: MessageCreatedEvent) => void
  'message.status': (event: MessageStatusEvent) => void
  'conversation.updated': (event: ConversationUpdatedEvent) => void
}

export type MessagingAck<T = object> = ({ ok: true } & T) | { ok: false, error: MessagingError }

export type SendMessageInput = { client_message_id: string, conversation_id: string, text: string }

export type SendMessageAck = MessagingAck<{ state: 'queued', client_message_id: string }>

export type MarkReadAck = MessagingAck

export type MessagingConnectionFailure = 'unauthenticated' | 'forbidden' | 'unreachable'

export type MessagingCapabilities = {
  portal: string
  permissions: string[]
}
