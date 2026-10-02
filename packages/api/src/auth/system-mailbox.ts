import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type { MailServer, SendMailPayload } from './types'

// The platform's own mailbox. It behaves like a tenant's, behind the admin portal.
const BASE = '/auth/system/mailbox'

export type PlatformMailAttachment = {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
}

export type PlatformMailMessage = {
  id: string
  threadId: string
  messageId: string
  folder: string
  subject: string
  from: { address: string, name: string | null }
  to: { address: string, name: string | null }[]
  cc: { address: string, name: string | null }[]
  bodyText: string | null
  bodyHtml: string | null
  attachments: PlatformMailAttachment[]
  sentAt: string
  receivedAt: string
  seen: boolean
  starred: boolean
  labels: string[]
  deliveryStatus: 'unknown' | 'bounced'
  deliveryDetail: string | null
}

export type PlatformMailThread = {
  id: string
  subject: string
  participants: { address: string, name: string | null }[]
  messageCount: number
  lastMessageAt: string
  hasUnread: boolean
}

export type PlatformMailThreadPage = { threads: PlatformMailThread[], total: number }

export type PlatformMailServerView = {
  host: string
  port: number
  username: string
  secure: boolean
  passwordPreview: string
}

export type PlatformMailCredentials = {
  tenantId: string
  emailAddress: string
  displayName: string | null
  imap: PlatformMailServerView
  smtp: PlatformMailServerView
  lastVerifiedAt: string | null
  lastError: string | null
  updatedAt: string
}

export type PlatformMailCredentialsInput = {
  emailAddress: string
  displayName?: string
  imap: MailServer
  smtp: MailServer
}

export async function getPlatformMailCredentials() {
  const { data } = await axiosInstance.get<ServerResponse<PlatformMailCredentials | null>>(`${BASE}/credentials`)
  return data.data
}

export async function savePlatformMailCredentials(input: PlatformMailCredentialsInput) {
  const { data } = await axiosInstance.put<ServerResponse<PlatformMailCredentials>>(`${BASE}/credentials`, input)
  return data.data
}

export async function deletePlatformMailCredentials() {
  await axiosInstance.delete(`${BASE}/credentials`)
}

export async function getPlatformMailThreads(limit: number, offset: number) {
  const { data } = await axiosInstance.get<ServerResponse<PlatformMailThreadPage>>(`${BASE}/threads`, {
    params: { limit, offset },
  })
  return data.data
}

export async function getPlatformMailThread(id: string) {
  const { data } = await axiosInstance.get<ServerResponse<PlatformMailMessage[]>>(`${BASE}/threads/${encodeURIComponent(id)}`)
  return data.data
}

export async function getPlatformMailAttachmentLink(messageId: string, index: number) {
  const { data } = await axiosInstance.get<ServerResponse<{ url: string }>>(
    `${BASE}/messages/${encodeURIComponent(messageId)}/attachments/${index}`,
  )
  return data.data.url
}

export async function sendPlatformMail(input: SendMailPayload['data']) {
  const { data } = await axiosInstance.post<ServerResponse<{ messageId: string, filedToSent: boolean }>>(`${BASE}/send`, input)
  return data.data
}

export async function setPlatformMailStarred(messageId: string, starred: boolean) {
  await axiosInstance.patch(`${BASE}/messages/${encodeURIComponent(messageId)}/flags`, { starred })
}
