import { axiosInstance } from '../lib/axios-instance'

import type {
  CreatePlatformCampaignInput,
  PlatformCampaign,
  PlatformCampaignDetail,
  PlatformCampaignList,
  PlatformCampaignQuery,
} from './campaign-types'

const BASE = '/notify/system/campaigns'

export async function getPlatformCampaigns(query: PlatformCampaignQuery = {}) {
  const { data } = await axiosInstance.get<PlatformCampaignList>(BASE, {
    params: { status: query.status, query: query.query || undefined, page: query.page, limit: query.limit },
  })
  return data
}

export async function getPlatformCampaign(id: string) {
  const { data } = await axiosInstance.get<PlatformCampaignDetail>(`${BASE}/${id}`)
  return data
}

export async function createPlatformCampaign(input: CreatePlatformCampaignInput) {
  const { data } = await axiosInstance.post<PlatformCampaign>(BASE, input)
  return data
}

export async function sendPlatformCampaign(id: string, retryFailedOnly = false) {
  const { data } = await axiosInstance.post<{ campaign: PlatformCampaign, attempted: number }>(
    `${BASE}/${id}/${retryFailedOnly ? 'retry' : 'send'}`,
  )
  return data
}

export async function cancelPlatformCampaign(id: string) {
  const { data } = await axiosInstance.post<PlatformCampaign>(`${BASE}/${id}/cancel`)
  return data
}
