export type SmsTemplateCategory = 'general' | 'job' | 'delivery' | 'safety' | 'payment'

export type SmsTemplate = {
  id: string
  name: string
  category: SmsTemplateCategory
  content: string
  variables: string[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type SmsTemplateInput = {
  name: string
  category: SmsTemplateCategory
  content: string
  is_active?: boolean
}

export type SmsTemplateTestInput = {
  to: string
  values: Record<string, string>
}
