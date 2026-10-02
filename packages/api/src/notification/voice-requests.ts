import { axiosInstance } from '../lib/axios-instance'

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
  const { data } = await axiosInstance.get<VoiceStatus>(`${BASE}/status`)
  return data
}

export async function getVoiceStats(days: number) {
  const { data } = await axiosInstance.get<VoiceStats>(`${BASE}/stats`, { params: { days } })
  return data
}

export async function getVoicePrompts() {
  const { data } = await axiosInstance.get<{ items: IvrPrompt[] }>(`${BASE}/prompts`)
  return data.items
}

export async function saveVoicePrompt(input: IvrPromptInput, id?: string) {
  const request = id
    ? axiosInstance.patch<IvrPrompt>(`${BASE}/prompts/${id}`, input)
    : axiosInstance.post<IvrPrompt>(`${BASE}/prompts`, input)
  return (await request).data
}

export async function deleteVoicePrompt(id: string) {
  await axiosInstance.delete(`${BASE}/prompts/${id}`)
}

export async function getVoiceCalls(query: VoiceCallQuery = {}) {
  const { data } = await axiosInstance.get<VoiceCallList>(`${BASE}/calls`, {
    params: { ...query, query: query.query || undefined, recording: query.recording ? 'true' : undefined },
  })
  return data
}

export async function initiateVoiceCall(input: InitiateVoiceCallInput) {
  const { data } = await axiosInstance.post<VoiceCall>(`${BASE}/calls`, input)
  return data
}

export async function updateVoiceCallNotes(id: string, notes: string) {
  const { data } = await axiosInstance.patch<VoiceCall>(`${BASE}/calls/${id}`, { notes })
  return data
}
