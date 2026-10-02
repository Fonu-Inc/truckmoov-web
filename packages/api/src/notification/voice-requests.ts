import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type {
  InitiateVoiceCallInput,
  IvrPrompt,
  IvrPromptInput,
  VoiceCall,
  VoiceCallList,
  VoiceCallQuery,
  VoiceStats,
  VoiceStatus,
} from './voice-types'

const BASE = '/notify/system/voice'

export async function getVoiceStatus() {
  const { data } = await axiosInstance.get<ServerResponse<VoiceStatus>>(`${BASE}/status`)
  return data.data
}

export async function getVoiceStats(days: number) {
  const { data } = await axiosInstance.get<ServerResponse<VoiceStats>>(`${BASE}/stats`, { params: { days } })
  return data.data
}

export async function getVoicePrompts() {
  const { data } = await axiosInstance.get<ServerResponse<{ items: IvrPrompt[] }>>(`${BASE}/prompts`)
  return data.data.items
}

export async function saveVoicePrompt(input: IvrPromptInput, id?: string) {
  const request = id
    ? axiosInstance.patch<ServerResponse<IvrPrompt>>(`${BASE}/prompts/${id}`, input)
    : axiosInstance.post<ServerResponse<IvrPrompt>>(`${BASE}/prompts`, input)
  return (await request).data.data
}

export async function deleteVoicePrompt(id: string) {
  await axiosInstance.delete(`${BASE}/prompts/${id}`)
}

export async function getVoiceCalls(query: VoiceCallQuery = {}) {
  const { data } = await axiosInstance.get<ServerResponse<VoiceCallList>>(`${BASE}/calls`, {
    params: { ...query, query: query.query || undefined, recording: query.recording ? 'true' : undefined },
  })
  return data.data
}

export async function initiateVoiceCall(input: InitiateVoiceCallInput) {
  const { data } = await axiosInstance.post<ServerResponse<VoiceCall>>(`${BASE}/calls`, input)
  return data.data
}

export async function updateVoiceCallNotes(id: string, notes: string) {
  const { data } = await axiosInstance.patch<ServerResponse<VoiceCall>>(`${BASE}/calls/${id}`, { notes })
  return data.data
}
