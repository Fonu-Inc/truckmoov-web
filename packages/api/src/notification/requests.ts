import { axiosInstance } from '../lib/axios-instance'

import type {
  ConnectWhatsAppAccountPayload,
  CreateWhatsAppTemplatePayload,
  CreateWhatsAppTemplateResponse,
  DeliveryLogQuery,
  DeleteSystemWhatsAppTemplatePayload,
  DeleteSystemWhatsAppTemplateResponse,
  DeliveryLogResponse,
  DisconnectWhatsAppAccountPayload,
  DisconnectWhatsAppAccountResponse,
  NotifyHealthResponse,
  NotifyOutboxMessageResponse,
  RetryNotifyMessagePayload,
  SendJobInstructionPayload,
  SendNotifyMessagePayload,
  SendOtherTemplatePayload,
  SendSystemWhatsAppTemplatePayload,
  SendSystemWhatsAppTemplateResponse,
  SendWhatsAppMediaMessagePayload,
  SendWhatsAppMessageResponse,
  SendWhatsAppTemplateResponse,
  SendWhatsAppTextMessagePayload,
  SystemWhatsAppAccountQuery,
  SystemWhatsAppTemplatesQuery,
  WhatsAppAccountResponse,
  WhatsAppConversationListResponse,
  WhatsAppConversationMessagesResponse,
  WhatsAppConversationPayload,
  WhatsAppConversationResponse,
  WhatsAppConversationsQuery,
  WhatsAppTemplateListResponse,
} from './types'

// ─── Outbox messages ──────────────────────────────────────────────────────────

export async function sendNotifyMessage({ data: body }: SendNotifyMessagePayload) {
  const { data } = await axiosInstance.post<NotifyOutboxMessageResponse>('/notify/messages/send', body)
  return data
}

export async function retryNotifyMessage({ id }: RetryNotifyMessagePayload) {
  const { data } = await axiosInstance.post<NotifyOutboxMessageResponse>(`/notify/messages/retry/${id}`)
  return data
}

// ─── WhatsApp conversations ───────────────────────────────────────────────────

export async function getWhatsAppConversations(payload?: WhatsAppConversationsQuery) {
  const { data } = await axiosInstance.get<WhatsAppConversationListResponse>(
    '/notify/whatsapp/conversations',
    { params: payload?.params },
  )
  return data
}

export async function getWhatsAppConversation({ id }: WhatsAppConversationPayload) {
  const { data } = await axiosInstance.get<WhatsAppConversationResponse>(
    `/notify/whatsapp/conversations/${id}`,
  )
  return data
}

export async function getWhatsAppConversationMessages({ id }: WhatsAppConversationPayload) {
  const { data } = await axiosInstance.get<WhatsAppConversationMessagesResponse>(
    `/notify/whatsapp/conversations/${id}/messages`,
  )
  return data
}

// ─── WhatsApp templates ───────────────────────────────────────────────────────

// POST, not GET — the server proxies Meta's Graph API behind a POST.
export async function getWhatsAppTemplates() {
  const { data } = await axiosInstance.post<WhatsAppTemplateListResponse>(
    '/notify/whatsapp/get-all-templates',
  )
  return data
}

export async function createWhatsAppTemplate({ data: body }: CreateWhatsAppTemplatePayload) {
  const { data } = await axiosInstance.post<CreateWhatsAppTemplateResponse>(
    '/notify/whatsapp/create-template',
    body,
  )
  return data
}

// ─── WhatsApp sending ─────────────────────────────────────────────────────────

export async function sendJobInstruction({ data: body }: SendJobInstructionPayload) {
  const { data } = await axiosInstance.post<SendWhatsAppTemplateResponse>(
    '/notify/whatsapp/send-job-instruction',
    body,
  )
  return data
}

export async function sendOtherTemplate({ data: body }: SendOtherTemplatePayload) {
  const { data } = await axiosInstance.post<SendWhatsAppTemplateResponse>(
    '/notify/whatsapp/send-other-template',
    body,
  )
  return data
}

export async function sendWhatsAppTextMessage({ data: body }: SendWhatsAppTextMessagePayload) {
  const { data } = await axiosInstance.post<SendWhatsAppMessageResponse>(
    '/notify/whatsapp/send-message',
    body,
  )
  return data
}

export async function sendWhatsAppMediaMessage({ data: body }: SendWhatsAppMediaMessagePayload) {
  const { data } = await axiosInstance.post<SendWhatsAppMessageResponse>(
    '/notify/whatsapp/send-message-with-media',
    body,
  )
  return data
}

// ─── WhatsApp account settings ────────────────────────────────────────────────

export async function getWhatsAppAccount() {
  const { data } = await axiosInstance.get<WhatsAppAccountResponse>('/notify/whatsapp/settings')
  return data
}

export async function connectWhatsAppAccount({ data: body }: ConnectWhatsAppAccountPayload) {
  const { data } = await axiosInstance.post<WhatsAppAccountResponse>('/notify/whatsapp/settings', body)
  return data
}

export async function disconnectWhatsAppAccount({ phoneNumberId }: DisconnectWhatsAppAccountPayload) {
  const { data } = await axiosInstance.delete<DisconnectWhatsAppAccountResponse>(
    `/notify/whatsapp/settings/${phoneNumberId}`,
  )
  return data
}

// ─── Platform WhatsApp account (platform admin, held under the system tenant) ──

export async function getSystemWhatsAppAccount(query?: SystemWhatsAppAccountQuery) {
  const { data } = await axiosInstance.get<WhatsAppAccountResponse>('/notify/system/whatsapp/settings', {
    params: query?.refresh ? { refresh: true } : undefined,
  })
  return data
}

export async function refreshSystemWhatsAppAccount() {
  const { data } = await axiosInstance.post<WhatsAppAccountResponse>('/notify/system/whatsapp/settings/refresh')
  return data
}

export async function resubscribeSystemWhatsAppAccount() {
  const { data } = await axiosInstance.post<WhatsAppAccountResponse>('/notify/system/whatsapp/settings/resubscribe')
  return data
}

export async function registerSystemWhatsAppNumber() {
  const { data } = await axiosInstance.post<WhatsAppAccountResponse>('/notify/system/whatsapp/settings/register')
  return data
}

export async function connectSystemWhatsAppAccount({ data: body }: ConnectWhatsAppAccountPayload) {
  const { data } = await axiosInstance.post<WhatsAppAccountResponse>('/notify/system/whatsapp/settings', body)
  return data
}

export async function disconnectSystemWhatsAppAccount({ phoneNumberId, deregister }: DisconnectWhatsAppAccountPayload) {
  const { data } = await axiosInstance.delete<DisconnectWhatsAppAccountResponse>(
    `/notify/system/whatsapp/settings/${phoneNumberId}`,
    { params: deregister ? { deregister: true } : undefined },
  )
  return data
}

export async function getSystemWhatsAppTemplates(query?: SystemWhatsAppTemplatesQuery) {
  const { data } = await axiosInstance.get<WhatsAppTemplateListResponse>('/notify/system/whatsapp/templates', {
    params: query,
  })
  return data
}

export async function createSystemWhatsAppTemplate({ data: body }: CreateWhatsAppTemplatePayload) {
  const { data } = await axiosInstance.post<CreateWhatsAppTemplateResponse>('/notify/system/whatsapp/templates', body)
  return data
}

export async function deleteSystemWhatsAppTemplate({ name }: DeleteSystemWhatsAppTemplatePayload) {
  const { data } = await axiosInstance.delete<DeleteSystemWhatsAppTemplateResponse>(
    `/notify/system/whatsapp/templates/${encodeURIComponent(name)}`,
  )
  return data
}

/** Sends an approved template from the platform number: starts a conversation or reopens a locked one. */
export async function sendSystemWhatsAppTemplate({ data: body }: SendSystemWhatsAppTemplatePayload) {
  const { data } = await axiosInstance.post<SendSystemWhatsAppTemplateResponse>('/notify/system/whatsapp/outreach', body)
  return data
}

// ─── Delivery log ─────────────────────────────────────────────────────────────

export async function getDeliveryLog(payload?: DeliveryLogQuery) {
  const { data } = await axiosInstance.get<DeliveryLogResponse>('/notify/delivery-log', {
    params: payload?.params,
  })
  return data
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function getNotifyHealth() {
  const { data } = await axiosInstance.get<NotifyHealthResponse>('/notify/health')
  return data
}
