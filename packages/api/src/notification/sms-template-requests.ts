import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type { SmsTemplate, SmsTemplateInput, SmsTemplateTestInput } from './sms-template-types'

const BASE = '/notify/system/sms-templates'

export async function getSmsTemplates() {
  const { data } = await axiosInstance.get<ServerResponse<{ items: SmsTemplate[] }>>(BASE)
  return data.data.items
}

export async function createSmsTemplate(input: SmsTemplateInput) {
  const { data } = await axiosInstance.post<ServerResponse<SmsTemplate>>(BASE, input)
  return data.data
}

export async function updateSmsTemplate(id: string, input: Partial<SmsTemplateInput>) {
  const { data } = await axiosInstance.patch<ServerResponse<SmsTemplate>>(`${BASE}/${id}`, input)
  return data.data
}

export async function deleteSmsTemplate(id: string) {
  await axiosInstance.delete(`${BASE}/${id}`)
}

export async function testSmsTemplate(id: string, input: SmsTemplateTestInput) {
  const { data } = await axiosInstance.post<ServerResponse<{ rendered: string }>>(`${BASE}/${id}/test`, input)
  return data.data
}
