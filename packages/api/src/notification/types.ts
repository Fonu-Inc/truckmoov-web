import type { ServerResponse } from '../lib/types'

// ponytail: the server accepts camelCase aliases for most snake_case body
// fields. Only the canonical (documented-required) snake_case form is typed —
// adding both doubles every payload type for no gain.

// ─── Outbox messages ──────────────────────────────────────────────────────────

export type NotifyOutboxMessage = {
  id?: string
  tenant_id?: string
  channel?: string
  recipient?: string
  content?: string
  status?: string
  retries?: number
  created_at?: string
  updated_at?: string
}

/** `POST /notify/messages/send` and `POST /notify/messages/retry/{id}` return the record unwrapped. */
export type NotifyOutboxMessageResponse = NotifyOutboxMessage

export type SendNotifyMessagePayload = {
  data: {
    tenant_id: string
    channel: string
    recipient: string
    content: string
  }
}

export type RetryNotifyMessagePayload = {
  id: string
}

// ─── WhatsApp conversations ───────────────────────────────────────────────────

export type WhatsAppConversationState = 'open' | 'locked'

export type WhatsAppConversation = {
  id?: string
  tenant_id?: string
  driver_name?: string
  driver_phone?: string
  is_locked?: boolean
  last_message_preview?: string
  last_message_direction?: string
  last_message_type?: string
  last_message_at?: string | null
  last_inbound_message_at?: string | null
  last_outbound_message_at?: string | null
  last_template_sent_at?: string | null
  window_expires_at?: string | null
  window_remaining_seconds?: number
  window_remaining_hours?: number
  created_at?: string
  updated_at?: string
}

export type WhatsAppMessage = {
  id?: string
  conversation_id?: string
  tenant_id?: string
  direction?: string
  message_type?: string
  status?: string
  text?: string
  caption?: string
  media_id?: string
  media_link?: string
  media_type?: string
  template_name?: string
  from_phone?: string
  to_phone?: string
  provider_message_id?: string
  sender_role?: string
  sender_subject?: string
  payload?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type WhatsAppConversationListResponse = ServerResponse<WhatsAppConversation[]>
export type WhatsAppConversationResponse = ServerResponse<WhatsAppConversation>

export type WhatsAppConversationMessagesResponse = ServerResponse<{
  conversation?: WhatsAppConversation
  messages?: WhatsAppMessage[]
}>

export type WhatsAppConversationsQuery = {
  params?: {
    query?: string
    state?: WhatsAppConversationState
  }
}

export type WhatsAppConversationPayload = {
  id: string
}

// ─── WhatsApp templates ───────────────────────────────────────────────────────

export type WhatsAppTemplateType = 'job_assignment' | 'other'

export type WhatsAppTemplate = {
  id?: string
  name?: string
  language?: string
  status?: string
  category?: string
  sub_category?: string
  previous_category?: string
  rejected_reason?: string
  quality_score?: { score?: string }
  components?: Record<string, unknown>[]
}

export type SystemWhatsAppTemplatesQuery = {
  limit?: number
  after?: string
}

export type DeleteSystemWhatsAppTemplatePayload = {
  name: string
}

export type DeleteSystemWhatsAppTemplateResponse = ServerResponse<{
  name?: string
}>

export type WhatsAppTemplateListResponse = ServerResponse<{
  data?: WhatsAppTemplate[]
  paging?: {
    next?: string
    cursors?: Record<string, string>
  }
}>

export type CreateWhatsAppTemplateResponse = ServerResponse<{
  id?: string
  status?: string
  category?: string
}>

export type CreateWhatsAppTemplatePayload = {
  data: {
    name: string
    language?: string
    category?: string
    header?: string
    body?: string
    components?: Record<string, unknown>[]
    parameter_format?: string
    template_type?: WhatsAppTemplateType
    allow_category_change?: boolean
  }
}

// ─── WhatsApp sending ─────────────────────────────────────────────────────────

export type WhatsAppHeaderMedia = {
  type?: 'image' | 'video' | 'document'
  id?: string
  link?: string
  filename?: string
}

export type WhatsAppButtonParameter = {
  index: number
  type?: 'quick_reply' | 'url' | 'copy_code'
  text?: string
  payload?: string
}

export type WhatsAppJobPriority = 'low' | 'normal' | 'high' | 'urgent'

export type SendJobInstructionPayload = {
  data: {
    to: string
    template_name: string
    driver_name: string
    job_reference: string
    pickup_location: string
    delivery_location: string
    cargo_description: string
    priority: WhatsAppJobPriority
    driver_id?: string
    job_id?: string
    language?: string
    header_media?: WhatsAppHeaderMedia
    button_parameters?: WhatsAppButtonParameter[]
  }
}

export type SendOtherTemplatePayload = {
  data: {
    to: string
    template_name: string
    language?: string
    template_variables?: Record<string, string>
    header_media?: WhatsAppHeaderMedia
    button_parameters?: WhatsAppButtonParameter[]
  }
}

/** Both template sends return the queued outbox record. */
export type SendWhatsAppTemplateResponse = ServerResponse<NotifyOutboxMessage>

export type SendWhatsAppTextMessagePayload = {
  data: {
    to: string
    message: string
  }
}

export type WhatsAppMediaType = 'image' | 'video' | 'audio' | 'document'

export type SendWhatsAppMediaMessagePayload = {
  data: {
    to: string
    media_type: WhatsAppMediaType
    media_id?: string
    media_link?: string
    caption?: string
    filename?: string
  }
}

export type SendWhatsAppMessageResponse = ServerResponse<{
  conversation?: WhatsAppConversation
  message?: WhatsAppMessage
  outbox_message?: NotifyOutboxMessage
}>

// ─── WhatsApp account settings ────────────────────────────────────────────────

export type WhatsAppConnectionStepName = 'token' | 'profile' | 'subscribed' | 'registered'

export type WhatsAppConnectionStep = {
  name: WhatsAppConnectionStepName
  status: 'ok' | 'failed' | 'skipped'
  error?: string
}

export type WhatsAppAccount = {
  id?: string
  tenant_id?: string
  business_account_id?: string
  business_name?: string
  verified_name?: string
  display_phone_number?: string
  phone_number_id?: string
  quality_rating?: string
  number_status?: string
  name_status?: string
  messaging_limit_tier?: string
  platform_type?: string
  coexistence?: boolean
  token_status?: 'valid' | 'needs_reconnect'
  token_expires_at?: string | null
  token_never_expires?: boolean
  status_error?: string
  webhook_error?: string
  register_error?: string
  registered_at?: string | null
  last_checked_at?: string | null
  steps?: WhatsAppConnectionStep[]
  connected_at?: string
  webhook_subscribed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type WhatsAppAccountResponse = ServerResponse<WhatsAppAccount>

export type ConnectWhatsAppAccountPayload = {
  data: {
    code: string
    business_account_id?: string
    phone_number_id?: string
    business_id?: string
    coexistence?: boolean
  }
}

export type DisconnectWhatsAppAccountPayload = {
  phoneNumberId: string
  /** Also release the number at Meta. Platform number only. */
  deregister?: boolean
}

export type DisconnectWhatsAppAccountResponse = ServerResponse<{
  phone_number_id?: string
  unsubscribed?: boolean
  deregistered?: boolean
  warnings?: string[]
}>

export type SystemWhatsAppAccountQuery = {
  /** Skip the one-minute cache and read the number's state from Meta now. */
  refresh?: boolean
}

export type SendSystemWhatsAppTemplatePayload = {
  data: {
    /** Reopen this conversation. Omit it to start one with `phone`. */
    conversation_id?: string
    phone?: string
    name?: string
    template_name: string
    language?: string
    /** Values for {{1}}, {{2}}... keyed by their number. */
    variables?: Record<string, string>
    client_message_id?: string
  }
}

export type SendSystemWhatsAppTemplateResponse = ServerResponse<{
  conversation?: {
    id: string
    driver_name: string | null
    driver_phone: string
    last_message_preview: string
    last_message_at: string
    last_message_direction: string
    unread_count: number
    is_locked: boolean
    window_remaining_hours: number | null
  }
  message?: {
    id: string
    client_message_id: string | null
    direction: string
    status: string
    text: string | null
    message_type: string
    created_at: string
    error?: { code: string, message: string }
  }
}>

// ─── Delivery log ─────────────────────────────────────────────────────────────

export type DeliveryLogNotificationType =
  | 'generic'
  | 'kyc_decision'
  | 'compliance_reminder'
  | 'job_assignment'
  | 'campaign'
  | 'spending_limit'

export type DeliveryLogEntry = {
  id?: string
  tenant_id?: string
  notification_type?: string
  channel?: string
  recipient?: string
  subject?: string
  content?: string
  status?: string
  provider_message_id?: string
  failure_reason?: string
  delivered_at?: string | null
  created_at?: string
  updated_at?: string
}

export type DeliveryLogPage = {
  entries?: DeliveryLogEntry[]
  total?: number
  limit?: number
  offset?: number
}

export type DeliveryLogResponse = ServerResponse<DeliveryLogPage>

export type DeliveryLogQuery = {
  params?: {
    notification_type?: DeliveryLogNotificationType
    channel?: string
    status?: string
    limit?: number
    offset?: number
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────

// ponytail: /notify/health is a probe route kept for parity with getAuthHealth
export type NotifyHealthResponse = {
  service?: string
  status?: string
}
