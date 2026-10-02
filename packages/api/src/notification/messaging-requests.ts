import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type {
  MessagingBulkInput,
  MessagingCannedReply,
  MessagingCannedReplyInput,
  MessagingCapabilities,
  MessagingConversation,
  MessagingConversationPage,
  MessagingContactLinks,
  MessagingConversationUpdate,
  MessagingConversationsQuery,
  MessagingMediaInput,
  MessagingMessage,
  MessagingMessagePage,
  MessagingMessagesQuery,
  MessagingScheduleInput,
  MessagingUnreadSummary,
} from './messaging-types'

const BASE = '/notify/system/whatsapp/conversations'

export async function getMessagingConversations(query: MessagingConversationsQuery = {}) {
  const { data } = await axiosInstance.get<MessagingConversationPage>(BASE, {
    params: {
      cursor: query.cursor || undefined,
      limit: query.limit,
      query: query.query || undefined,
      state: query.state,
      status: query.status,
      assignee: query.assignee,
      tag: query.tag,
    },
  })
  return data
}

export async function getMessagingConversation(id: string) {
  const { data } = await axiosInstance.get<MessagingConversation>(`${BASE}/${id}`)
  return data
}

export async function getMessagingMessages({ conversationId, before, limit }: MessagingMessagesQuery) {
  const { data } = await axiosInstance.get<MessagingMessagePage>(`${BASE}/${conversationId}/messages`, {
    params: { before: before || undefined, limit },
  })
  return data
}

export async function getMessagingCapabilities() {
  const { data } = await axiosInstance.get<ServerResponse<MessagingCapabilities>>('/auth/capabilities')
  return data.data
}

export async function updateMessagingConversation(id: string, update: MessagingConversationUpdate) {
  const { data } = await axiosInstance.patch<MessagingConversation>(`${BASE}/${id}`, update)
  return data
}

export async function bulkUpdateMessagingConversations(input: MessagingBulkInput) {
  const { data } = await axiosInstance.post<{ changed: number }>(`${BASE}/bulk`, {
    ids: input.ids,
    action: input.action,
    update: input.update,
  })
  return data
}

export async function addMessagingNote(conversationId: string, text: string) {
  const { data } = await axiosInstance.post<MessagingMessage>(`${BASE}/${conversationId}/notes`, { text })
  return data
}

export async function sendMessagingMedia({ conversationId, clientMessageId, file, caption }: MessagingMediaInput) {
  const form = new FormData()
  form.append('client_message_id', clientMessageId)
  form.append('file', file)
  if (caption)
    form.append('caption', caption)
  const { data } = await axiosInstance.post<MessagingMessage>(`${BASE}/${conversationId}/media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function scheduleMessagingMessage({ conversationId, clientMessageId, text, sendAt }: MessagingScheduleInput) {
  const { data } = await axiosInstance.post<MessagingMessage>(`${BASE}/${conversationId}/scheduled`, {
    client_message_id: clientMessageId,
    text,
    send_at: sendAt,
  })
  return data
}

export async function cancelScheduledMessagingMessage(conversationId: string, messageId: string) {
  await axiosInstance.delete(`${BASE}/${conversationId}/messages/${messageId}`)
}

export async function retryMessagingMessage(conversationId: string, messageId: string) {
  const { data } = await axiosInstance.post<MessagingMessage>(`${BASE}/${conversationId}/messages/${messageId}/retry`)
  return data
}

export async function fetchMessagingMedia(url: string) {
  const { data } = await axiosInstance.get<Blob>(url, { responseType: 'blob' })
  return data
}

const CANNED = '/notify/system/whatsapp/canned-replies'

export async function getMessagingCannedReplies() {
  const { data } = await axiosInstance.get<{ items: MessagingCannedReply[] }>(CANNED)
  return data.items
}

export async function createMessagingCannedReply(input: MessagingCannedReplyInput) {
  const { data } = await axiosInstance.post<MessagingCannedReply>(CANNED, input)
  return data
}

export async function updateMessagingCannedReply(id: string, input: MessagingCannedReplyInput) {
  const { data } = await axiosInstance.patch<MessagingCannedReply>(`${CANNED}/${id}`, input)
  return data
}

export async function deleteMessagingCannedReply(id: string) {
  await axiosInstance.delete(`${CANNED}/${id}`)
}

export async function getMessagingUnreadSummary() {
  const { data } = await axiosInstance.get<MessagingUnreadSummary>(`${BASE}/unread-summary`)
  return data
}

export async function getMessagingContactLinks(conversationId: string) {
  const { data } = await axiosInstance.get<MessagingContactLinks>(`${BASE}/${conversationId}/links`)
  return data
}
