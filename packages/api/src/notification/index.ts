import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  connectWhatsAppAccount,
  createWhatsAppTemplate,
  disconnectWhatsAppAccount,
  getWhatsAppAccount,
  getWhatsAppConversation,
  getWhatsAppConversationMessages,
  getWhatsAppConversations,
  getWhatsAppTemplates,
  retryNotifyMessage,
  sendJobInstruction,
  sendNotifyMessage,
  sendOtherTemplate,
  sendWhatsAppMediaMessage,
  sendWhatsAppTextMessage,
} from './requests'

export type * from './types'

import type { WhatsAppConversationsQuery } from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const NOTIFICATION_QUERY_KEY = {
  whatsappConversationsRoot: ['notification', 'whatsapp', 'conversations'],
  whatsappConversations: (payload?: WhatsAppConversationsQuery) => [
    'notification',
    'whatsapp',
    'conversations',
    payload,
  ],
  whatsappConversation: (id: string) => ['notification', 'whatsapp', 'conversation', id],
  whatsappConversationMessages: (id: string) => [
    'notification',
    'whatsapp',
    'conversation',
    id,
    'messages',
  ],
  whatsappTemplates: ['notification', 'whatsapp', 'templates'],
  whatsappAccount: ['notification', 'whatsapp', 'account'],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getWhatsAppConversationsQueryOptions(payload?: WhatsAppConversationsQuery) {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.whatsappConversations(payload),
    queryFn: () => getWhatsAppConversations(payload),
    placeholderData: keepPreviousData,
  })
}

export function getWhatsAppConversationQueryOptions(id: string) {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.whatsappConversation(id),
    queryFn: () => getWhatsAppConversation({ id }),
    enabled: Boolean(id),
  })
}

export function getWhatsAppConversationMessagesQueryOptions(id: string) {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationMessages(id),
    queryFn: () => getWhatsAppConversationMessages({ id }),
    enabled: Boolean(id),
  })
}

export function getWhatsAppTemplatesQueryOptions() {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.whatsappTemplates,
    queryFn: getWhatsAppTemplates,
  })
}

export function getWhatsAppAccountQueryOptions() {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.whatsappAccount,
    queryFn: getWhatsAppAccount,
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useWhatsAppConversations(payload?: WhatsAppConversationsQuery) {
  return useQuery(getWhatsAppConversationsQueryOptions(payload))
}

export function useWhatsAppConversation(id: string) {
  return useQuery(getWhatsAppConversationQueryOptions(id))
}

export function useWhatsAppConversationMessages(id: string) {
  return useQuery(getWhatsAppConversationMessagesQueryOptions(id))
}

export function useWhatsAppTemplates() {
  return useQuery(getWhatsAppTemplatesQueryOptions())
}

export function useWhatsAppAccount() {
  return useQuery(getWhatsAppAccountQueryOptions())
}

// ─── useMutation hooks ────────────────────────────────────────────────────────

export function useSendNotifyMessage() {
  return useMutation({ mutationFn: sendNotifyMessage })
}

export function useRetryNotifyMessage() {
  return useMutation({ mutationFn: retryNotifyMessage })
}

export function useCreateWhatsAppTemplate() {
  return useMutation({
    mutationFn: createWhatsAppTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappTemplates })
    },
  })
}

export function useSendJobInstruction() {
  return useMutation({
    mutationFn: sendJobInstruction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationsRoot })
    },
  })
}

export function useSendOtherTemplate() {
  return useMutation({
    mutationFn: sendOtherTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationsRoot })
    },
  })
}

export function useSendWhatsAppTextMessage() {
  return useMutation({
    mutationFn: sendWhatsAppTextMessage,
    onSuccess: (res) => {
      const id = res.data?.conversation?.id
      if (id) {
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationMessages(id),
        })
      }
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationsRoot })
    },
  })
}

export function useSendWhatsAppMediaMessage() {
  return useMutation({
    mutationFn: sendWhatsAppMediaMessage,
    onSuccess: (res) => {
      const id = res.data?.conversation?.id
      if (id) {
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationMessages(id),
        })
      }
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappConversationsRoot })
    },
  })
}

export function useConnectWhatsAppAccount() {
  return useMutation({
    mutationFn: connectWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappAccount })
    },
  })
}

export function useDisconnectWhatsAppAccount() {
  return useMutation({
    mutationFn: disconnectWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY.whatsappAccount })
    },
  })
}
