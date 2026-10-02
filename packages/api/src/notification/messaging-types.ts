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
  status: MessagingConversationStatus
  priority: MessagingConversationPriority
  assignee_user_id: string | null
  tags: string[]
  first_seen_at: string
}

export type MessagingConversationStatus = 'open' | 'pending' | 'resolved'

export type MessagingConversationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type MessagingMessageStatus = 'received' | 'scheduled' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

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

export type MessagingMediaType = 'image' | 'video' | 'audio' | 'document'

export type MessagingMessageType = 'text' | 'template' | 'note' | 'other' | MessagingMediaType

export type MessagingMedia = {
  type: MessagingMediaType
  /** Path of the authenticated media route, empty when the file is gone. */
  url: string
  filename: string | null
  caption: string | null
}

export type MessagingMessage = {
  id: string
  client_message_id: string | null
  direction: 'inbound' | 'outbound' | 'internal'
  status: MessagingMessageStatus
  text: string | null
  message_type: MessagingMessageType
  created_at: string
  error?: MessagingError
  template_name?: string | null
  media?: MessagingMedia | null
  author_id?: string | null
  scheduled_for?: string | null
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
  status?: MessagingConversationStatus
  /** A user id, `me` or `unassigned`. */
  assignee?: string
  tag?: string
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

export type MessageDeletedEvent = { conversation_id: string, message_id: string, client_message_id?: string }

export type MessagingServerEvents = {
  'message.created': (event: MessageCreatedEvent) => void
  'message.status': (event: MessageStatusEvent) => void
  'conversation.updated': (event: ConversationUpdatedEvent) => void
  'message.deleted': (event: MessageDeletedEvent) => void
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

export type MessagingConversationUpdate = Partial<{
  name: string
  status: MessagingConversationStatus
  priority: MessagingConversationPriority
  assignee_user_id: string
  tags: string[]
}>

export type MessagingBulkInput = {
  ids: string[]
  action?: 'read' | 'unread'
  update?: MessagingConversationUpdate
}

export type MessagingMediaInput = {
  conversationId: string
  clientMessageId: string
  file: File
  caption?: string
}

export type MessagingScheduleInput = {
  conversationId: string
  clientMessageId: string
  text: string
  sendAt: string
}

export type MessagingCannedReply = {
  id: string
  shortcut: string
  title: string
  body: string
  created_by: string
  created_at: string
  updated_at: string
}

export type MessagingCannedReplyInput = { shortcut: string, title: string, body: string }

export type MessagingUnreadSummary = { conversations: number, at_least: boolean }

export type MessagingLinkedDriver = { driver_id: string, name: string, tenant_id: string, status: string }

export type MessagingContactLinks = { drivers: MessagingLinkedDriver[] }
