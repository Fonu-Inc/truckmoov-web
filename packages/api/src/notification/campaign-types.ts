export type CampaignChannel = 'whatsapp' | 'sms' | 'email'

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled'

export type CampaignRecipientState = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'suppressed'

export type CampaignProgress = {
  recipients: number
  sent: number
  delivered: number
  read: number
  failed: number
}

export type PlatformCampaign = {
  id: string
  name: string
  channels: CampaignChannel[]
  bodies: Partial<Record<CampaignChannel, string>>
  template_name: string
  status: CampaignStatus
  scheduled_for: string | null
  created_at: string
  progress: CampaignProgress
}

export type PlatformCampaignRecipient = {
  id: string
  audience_ref: string
  channel: CampaignChannel
  destination: string
  state: CampaignRecipientState
  failure_reason: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
}

export type PlatformCampaignList = {
  items: PlatformCampaign[]
  total: number
  summary: CampaignProgress
}

export type PlatformCampaignDetail = {
  campaign: PlatformCampaign
  recipients: PlatformCampaignRecipient[]
}

export type PlatformCampaignQuery = {
  status?: CampaignStatus
  query?: string
  page?: number
  limit?: number
}

export type CreatePlatformCampaignInput = {
  name: string
  channels: CampaignChannel[]
  bodies: Partial<Record<CampaignChannel, string>>
  template_name?: string
  scheduled_for?: string
  recipients: { audience_ref: string, channel: CampaignChannel, destination: string }[]
}
