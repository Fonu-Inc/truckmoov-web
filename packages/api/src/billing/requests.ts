import { axiosInstance } from '../lib/axios-instance'

import type {
  BillingIdPayload,
  BillingSummaryResponse,
  CreatePlanPayload,
  EnforcementListResponse,
  EnforcementPreviewResponse,
  EnforcementQuery,
  EnforcementSettingsResponse,
  EnforcementSettingsUpdate,
  InstallationPriceResponse,
  InvoiceResponse,
  InvoicesQuery,
  InvoicesResponse,
  TenantInvoiceDetailResponse,
  TenantInvoiceListResponse,
  TenantInvoicePayCardResponse,
  TenantInvoicePayWalletResponse,
  TenantInvoicesQuery,
  TenantLicenceResponse,
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

// ─── Payment enforcement ──────────────────────────────────────────────────────

export async function getEnforcementSettings() {
  const { data } = await axiosInstance.get<EnforcementSettingsResponse>(`${BASE}/enforcement-settings`)
  return data
}

export async function updateEnforcementSettings(payload: EnforcementSettingsUpdate) {
  const { data } = await axiosInstance.put<EnforcementSettingsResponse>(`${BASE}/enforcement-settings`, payload)
  return data
}

export async function listEnforcement(payload?: EnforcementQuery) {
  const { data } = await axiosInstance.get<EnforcementListResponse>(`${BASE}/enforcement`, { params: payload?.params })
  return data
}

export async function getEnforcementPreview() {
  const { data } = await axiosInstance.get<EnforcementPreviewResponse>(`${BASE}/enforcement/preview`)
  return data
}

// ─── Tenant billing ───────────────────────────────────────────────────────────

const TENANT_BASE = '/auth/billing'

export async function getTenantInvoices(payload?: TenantInvoicesQuery) {
  const { data } = await axiosInstance.get<TenantInvoiceListResponse>(`${TENANT_BASE}/invoices`, {
    params: payload?.params,
  })
  return data
}

export async function getTenantInvoice({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.get<TenantInvoiceDetailResponse>(`${TENANT_BASE}/invoices/${id}`)
  return data
}

export async function getTenantLicence() {
  const { data } = await axiosInstance.get<TenantLicenceResponse>(`${TENANT_BASE}/licence`)
  return data
}

export async function payTenantInvoiceFromWallet({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.post<TenantInvoicePayWalletResponse>(`${TENANT_BASE}/invoices/${id}/pay-wallet`)
  return data
}

export async function payTenantInvoiceByCard({ id }: BillingIdPayload) {
  const { data } = await axiosInstance.post<TenantInvoicePayCardResponse>(`${TENANT_BASE}/invoices/${id}/pay-card`)
  return data
}
