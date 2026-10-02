import { axiosInstance } from '../lib/axios-instance'

import type { SmsTemplate, SmsTemplateInput, SmsTemplateTestInput } from './sms-template-types'

const BASE = '/notify/system/sms-templates'

export async function getSmsTemplates() {
  const { data } = await axiosInstance.get<{ items: SmsTemplate[] }>(BASE)
  return data.items
}

export async function createSmsTemplate(input: SmsTemplateInput) {
  const { data } = await axiosInstance.post<SmsTemplate>(BASE, input)
  return data
}

export async function updateSmsTemplate(id: string, input: Partial<SmsTemplateInput>) {
  const { data } = await axiosInstance.patch<SmsTemplate>(`${BASE}/${id}`, input)
  return data
}

export async function deleteSmsTemplate(id: string) {
  await axiosInstance.delete(`${BASE}/${id}`)
}

export async function testSmsTemplate(id: string, input: SmsTemplateTestInput) {
  const { data } = await axiosInstance.post<{ rendered: string }>(`${BASE}/${id}/test`, input)
  return data
}
