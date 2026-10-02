export type VoiceLanguage = 'en' | 'ha' | 'yo' | 'ig' | 'pcm'

export type VoiceStatus = { provider: string, configured: boolean }

export type IvrPromptCategory = 'greeting' | 'menu' | 'confirmation' | 'error' | 'goodbye'

export type IvrPrompt = {
  id: string
  name: string
  category: IvrPromptCategory
  translations: Partial<Record<VoiceLanguage, string>>
  key_press: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type IvrPromptInput = {
  name: string
  category: IvrPromptCategory
  translations: Partial<Record<VoiceLanguage, string>>
  key_press: string
  is_active?: boolean
}

export type VoiceCallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed' | 'missed' | 'failed'

export type VoiceCall = {
  id: string
  provider_call_id: string
  direction: 'inbound' | 'outbound'
  from_number: string
  to_number: string
  contact_name: string
  status: VoiceCallStatus
  language: VoiceLanguage
  started_at: string
  answered_at: string | null
  ended_at: string | null
  duration_seconds: number
  recording_url: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

export type VoiceCallList = { items: VoiceCall[], total: number }

export type VoiceCallQuery = {
  direction?: 'inbound' | 'outbound'
  status?: VoiceCallStatus
  query?: string
  recording?: boolean
  page?: number
  limit?: number
}

export type InitiateVoiceCallInput = {
  to: string
  contact_name?: string
  language?: VoiceLanguage
  message?: string
  record?: boolean
}

export type VoiceDayStat = { day: string, total: number, completed: number, missed: number, failed: number }

export type VoiceStats = {
  total: number
  completed: number
  missed: number
  failed: number
  answer_rate: number
  average_duration_seconds: number
  by_language: Partial<Record<VoiceLanguage, number>>
  days: VoiceDayStat[]
}
