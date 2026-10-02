import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import type { ServerErrorResponse } from '../lib/types'
import {
  connectWhatsAppAccount,
  createWhatsAppTemplate,
  connectSystemWhatsAppAccount,
  createSystemWhatsAppTemplate,
  deleteSystemWhatsAppTemplate,
  disconnectSystemWhatsAppAccount,
  disconnectWhatsAppAccount,
  getDeliveryLog,
  getNotifyHealth,
  getSystemWhatsAppAccount,
  getSystemWhatsAppTemplates,
  getWhatsAppAccount,
  getWhatsAppConversation,
  getWhatsAppConversationMessages,
  getWhatsAppConversations,
  getWhatsAppTemplates,
  refreshSystemWhatsAppAccount,
  registerSystemWhatsAppNumber,
  resubscribeSystemWhatsAppAccount,
  retryNotifyMessage,
  sendJobInstruction,
  sendNotifyMessage,
  sendOtherTemplate,
  sendSystemWhatsAppTemplate,
  sendWhatsAppMediaMessage,
  sendWhatsAppTextMessage,
} from './requests'

export type * from './types'
export type * from './messaging-types'
export type * from './campaign-types'
export type * from './sms-template-types'
export type * from './voice-types'
export {
  cancelPlatformCampaign,
  createPlatformCampaign,
  getPlatformCampaign,
  getPlatformCampaigns,
  sendPlatformCampaign,
} from './campaign-requests'
export {
  createSmsTemplate,
  deleteSmsTemplate,
  getSmsTemplates,
  testSmsTemplate,
  updateSmsTemplate,
} from './sms-template-requests'
export {
  deleteVoicePrompt,
  getVoiceCalls,
  getVoicePrompts,
  getVoiceStats,
  getVoiceStatus,
  initiateVoiceCall,
  saveVoicePrompt,
  updateVoiceCallNotes,
} from './voice-requests'
export { createPlatformMessagingSocket } from './messaging-socket'
export type { PlatformMessagingSocket, PlatformMessagingSocketOptions } from './messaging-socket'
export {
  addMessagingNote,
  bulkUpdateMessagingConversations,
  cancelScheduledMessagingMessage,
  createMessagingCannedReply,
  deleteMessagingCannedReply,
  fetchMessagingMedia,
  getMessagingCannedReplies,
  getMessagingContactLinks,
  getMessagingCapabilities,
  getMessagingConversation,
  getMessagingConversations,
  getMessagingMessages,
  getMessagingUnreadSummary,
  retryMessagingMessage,
  scheduleMessagingMessage,
  sendMessagingMedia,
  updateMessagingCannedReply,
  updateMessagingConversation,
} from './messaging-requests'

import type { DeliveryLogQuery, SystemWhatsAppTemplatesQuery, WhatsAppConversationsQuery } from './types'

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
  systemWhatsappAccount: ['notification', 'system', 'whatsapp', 'account'],
  systemWhatsappTemplates: (query?: SystemWhatsAppTemplatesQuery) =>
    query
      ? ['notification', 'system', 'whatsapp', 'templates', query]
      : ['notification', 'system', 'whatsapp', 'templates'],
  deliveryLog: (payload?: DeliveryLogQuery) =>
    payload ? ['notification', 'deliveryLog', payload] : ['notification', 'deliveryLog'],
  notifyHealth: ['notification', 'health'],
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

export function getSystemWhatsAppAccountQueryOptions() {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.systemWhatsappAccount,
    // 404 means nothing is connected yet. Answering null keeps that a result:
    // a query left in error has no data, so every refetch on focus would
    // bring the loading state back.
    queryFn: async () => {
      try {
        return await getSystemWhatsAppAccount()
      }
      catch (error) {
        if ((error as ServerErrorResponse).statusCode === 404)
          return null
        throw error
      }
    },
    retry: false,
  })
}

export function getSystemWhatsAppTemplatesQueryOptions(query?: SystemWhatsAppTemplatesQuery) {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.systemWhatsappTemplates(query),
    queryFn: () => getSystemWhatsAppTemplates(query),
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

export function useConnectSystemWhatsAppAccount() {
  return useMutation({
    mutationFn: connectSystemWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification', 'system', 'whatsapp'] })
    },
  })
}

function invalidateSystemWhatsApp() {
  queryClient.invalidateQueries({ queryKey: ['notification', 'system', 'whatsapp'] })
}

export function useRefreshSystemWhatsAppAccount() {
  return useMutation({ mutationFn: refreshSystemWhatsAppAccount, onSettled: invalidateSystemWhatsApp })
}

export function useResubscribeSystemWhatsAppAccount() {
  return useMutation({ mutationFn: resubscribeSystemWhatsAppAccount, onSettled: invalidateSystemWhatsApp })
}

export function useRegisterSystemWhatsAppNumber() {
  return useMutation({ mutationFn: registerSystemWhatsAppNumber, onSettled: invalidateSystemWhatsApp })
}

export function useCreateSystemWhatsAppTemplate() {
  return useMutation({ mutationFn: createSystemWhatsAppTemplate, onSuccess: invalidateSystemWhatsApp })
}

export function useDeleteSystemWhatsAppTemplate() {
  return useMutation({ mutationFn: deleteSystemWhatsAppTemplate, onSuccess: invalidateSystemWhatsApp })
}

export function useSendSystemWhatsAppTemplate() {
  return useMutation({ mutationFn: sendSystemWhatsAppTemplate })
}

export function useDisconnectSystemWhatsAppAccount() {
  return useMutation({
    mutationFn: disconnectSystemWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification', 'system', 'whatsapp'] })
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

// ─── Delivery log ─────────────────────────────────────────────────────────────

export function getDeliveryLogQueryOptions(payload?: DeliveryLogQuery) {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.deliveryLog(payload),
    queryFn: () => getDeliveryLog(payload),
  })
}

// ─── Health ───────────────────────────────────────────────────────────────────

export function getNotifyHealthQueryOptions() {
  return queryOptions({
    queryKey: NOTIFICATION_QUERY_KEY.notifyHealth,
    queryFn: getNotifyHealth,
  })
}
