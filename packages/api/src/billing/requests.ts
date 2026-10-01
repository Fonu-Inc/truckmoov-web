import { axiosInstance } from '../lib/axios-instance'

import type {
  BillingIdPayload,
  BillingSummaryResponse,
  CreatePlanPayload,
  InstallationPriceResponse,
  InvoiceResponse,
  InvoicesQuery,
  InvoicesResponse,
  PaymentResponse,
  PaymentsQuery,
  PaymentsResponse,
  PlanActionResponse,
  PlanCodePayload,
  PlanDetailResponse,
  PlansQuery,
  PlansResponse,
  PriceHistoryQuery,
  PriceHistoryResponse,
  QuotationResponse,
  QuotationsQuery,
  QuotationsResponse,
  UpdateInstallationPricePayload,
  UpdatePlanPayload,
  UpdatePlanResponse,
} from './types'

const BASE = '/auth/system/billing'

export async function getBillingSummary() {
  const { data } = await axiosInstance.get<BillingSummaryResponse>(`${BASE}/summary`)
  return data
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function getBillingPlans(payload?: PlansQuery) {
  const { data } = await axiosInstance.get<PlansResponse>(`${BASE}/plans`, { params: payload?.params })
  return data
}

export async function getBillingPlan({ code }: PlanCodePayload) {
  const { data } = await axiosInstance.get<PlanDetailResponse>(`${BASE}/plans/${encodeURIComponent(code)}`)
  return data
}

export async function createBillingPlan({ data: body }: CreatePlanPayload) {
  const { data } = await axiosInstance.post<PlanActionResponse>(`${BASE}/plans`, body)
  return data
}

export async function updateBillingPlan({ code, data: body }: UpdatePlanPayload) {
  const { data } = await axiosInstance.patch<UpdatePlanResponse>(
    `${BASE}/plans/${encodeURIComponent(code)}`,
    body,
  )
  return data
}

export async function activateBillingPlan({ code }: PlanCodePayload) {
  const { data } = await axiosInstance.post<PlanActionResponse>(
    `${BASE}/plans/${encodeURIComponent(code)}/activate`,
  )
  return data
}

export async function deactivateBillingPlan({ code }: PlanCodePayload) {
  const { data } = await axiosInstance.post<PlanActionResponse>(
    `${BASE}/plans/${encodeURIComponent(code)}/deactivate`,
  )
  return data
}

// ─── Price history & installation price ───────────────────────────────────────

export async function getBillingPriceHistory(payload?: PriceHistoryQuery) {
  const { data } = await axiosInstance.get<PriceHistoryResponse>(`${BASE}/price-history`, {
    params: payload?.params,
  })
  return data
}

export async function getInstallationPrice() {
  const { data } = await axiosInstance.get<InstallationPriceResponse>(`${BASE}/installation-price`)
  return data
}

export async function updateInstallationPrice({ data: body }: UpdateInstallationPricePayload) {
  const { data } = await axiosInstance.put<InstallationPriceResponse>(`${BASE}/installation-price`, body)
  return data
}

// ─── Quotations, invoices, payments ───────────────────────────────────────────

export async function getBillingQuotations(payload?: QuotationsQuery) {
  const { data } = await axiosInstance.get<QuotationsResponse>(`${BASE}/quotations`, {
    params: payload?.params,
  })
  return data
}

export async function getBillingQuotation({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.get<QuotationResponse>(`${BASE}/quotations/${id}`)
  return data
}

export async function getBillingInvoices(payload?: InvoicesQuery) {
  const { data } = await axiosInstance.get<InvoicesResponse>(`${BASE}/invoices`, {
    params: payload?.params,
  })
  return data
}

export async function getBillingInvoice({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.get<InvoiceResponse>(`${BASE}/invoices/${id}`)
  return data
}

export async function getBillingPayments(payload?: PaymentsQuery) {
  const { data } = await axiosInstance.get<PaymentsResponse>(`${BASE}/payments`, {
    params: payload?.params,
  })
  return data
}

export async function getBillingPayment({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.get<PaymentResponse>(`${BASE}/payments/${id}`)
  return data
}
