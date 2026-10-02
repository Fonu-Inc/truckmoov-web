import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type {
  MessagingCapabilities,
  MessagingConversation,
  MessagingConversationPage,
  MessagingConversationsQuery,
  MessagingMessagePage,
  MessagingMessagesQuery,
} from './messaging-types'

const BASE = '/notify/system/whatsapp/conversations'

export async function getMessagingConversations(query: MessagingConversationsQuery = {}) {
  const { data } = await axiosInstance.get<MessagingConversationPage>(BASE, {
    params: {
      cursor: query.cursor || undefined,
      limit: query.limit,
      query: query.query || undefined,
      state: query.state,
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
