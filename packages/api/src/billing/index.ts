import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  activateBillingPlan,
  createBillingPlan,
  deactivateBillingPlan,
  getBillingInvoice,
  getEnforcementPreview,
  getEnforcementSettings,
  listEnforcement,
  updateEnforcementSettings,
  getBillingInvoices,
  getBillingPayment,
  getBillingPayments,
  getBillingPlan,
  getBillingPlans,
  getBillingPriceHistory,
  getBillingQuotation,
  getBillingQuotations,
  getBillingSummary,
  getInstallationPrice,
  getTenantInvoice,
  getTenantInvoices,
  getTenantLicence,
  payTenantInvoiceByCard,
  payTenantInvoiceFromWallet,
  updateBillingPlan,
  updateInstallationPrice,
} from './requests'

export type * from './types'

import type {
  EnforcementQuery,
  InvoicesQuery,
  PaymentsQuery,
  PlansQuery,
  PriceHistoryQuery,
  QuotationsQuery,
  TenantInvoicesQuery,
} from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const BILLING_QUERY_KEY = {
  root: ['billing'],
  summary: ['billing', 'summary'],
  plansRoot: ['billing', 'plans'],
  plans: (payload?: PlansQuery) => ['billing', 'plans', 'list', payload],
  plan: (code: string) => ['billing', 'plans', 'detail', code],
  priceHistoryRoot: ['billing', 'priceHistory'],
  priceHistory: (payload?: PriceHistoryQuery) => ['billing', 'priceHistory', payload],
  installationPrice: ['billing', 'installationPrice'],
  quotationsRoot: ['billing', 'quotations'],
  quotations: (payload?: QuotationsQuery) => ['billing', 'quotations', 'list', payload],
  quotation: (id: string) => ['billing', 'quotations', 'detail', id],
  invoicesRoot: ['billing', 'invoices'],
  invoices: (payload?: InvoicesQuery) => ['billing', 'invoices', 'list', payload],
  invoice: (id: string) => ['billing', 'invoices', 'detail', id],
  paymentsRoot: ['billing', 'payments'],
  payments: (payload?: PaymentsQuery) => ['billing', 'payments', 'list', payload],
  payment: (id: string) => ['billing', 'payments', 'detail', id],
  enforcementRoot: ['billing', 'enforcement'],
  enforcementSettings: ['billing', 'enforcement', 'settings'],
  enforcementList: (payload?: EnforcementQuery) => ['billing', 'enforcement', 'list', payload],
  enforcementPreview: ['billing', 'enforcement', 'preview'],
  tenantRoot: ['billing', 'tenant'],
  tenantInvoices: (payload?: TenantInvoicesQuery) => ['billing', 'tenant', 'invoices', payload],
  tenantInvoice: (id: string) => ['billing', 'tenant', 'invoice', id],
  tenantLicence: ['billing', 'tenant', 'licence'],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getBillingSummaryQueryOptions() {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.summary,
    queryFn: getBillingSummary,
  })
}

export function getBillingPlansQueryOptions(payload?: PlansQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.plans(payload),
    queryFn: () => getBillingPlans(payload),
    placeholderData: keepPreviousData,
  })
}

export function getBillingPlanQueryOptions(code: string) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.plan(code),
    queryFn: () => getBillingPlan({ code }),
    enabled: Boolean(code),
  })
}

export function getBillingPriceHistoryQueryOptions(payload?: PriceHistoryQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.priceHistory(payload),
    queryFn: () => getBillingPriceHistory(payload),
    placeholderData: keepPreviousData,
  })
}

export function getInstallationPriceQueryOptions() {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.installationPrice,
    queryFn: getInstallationPrice,
  })
}

export function getBillingQuotationsQueryOptions(payload?: QuotationsQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.quotations(payload),
    queryFn: () => getBillingQuotations(payload),
    placeholderData: keepPreviousData,
  })
}

export function getBillingQuotationQueryOptions(id: string) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.quotation(id),
    queryFn: () => getBillingQuotation({ id }),
    enabled: Boolean(id),
  })
}

export function getBillingInvoicesQueryOptions(payload?: InvoicesQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.invoices(payload),
    queryFn: () => getBillingInvoices(payload),
    placeholderData: keepPreviousData,
  })
}

export function getBillingInvoiceQueryOptions(id: string) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.invoice(id),
    queryFn: () => getBillingInvoice({ id }),
    enabled: Boolean(id),
  })
}

export function getBillingPaymentsQueryOptions(payload?: PaymentsQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.payments(payload),
    queryFn: () => getBillingPayments(payload),
    placeholderData: keepPreviousData,
  })
}

export function getBillingPaymentQueryOptions(id: string) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.payment(id),
    queryFn: () => getBillingPayment({ id }),
    enabled: Boolean(id),
  })
}

export function getEnforcementSettingsQueryOptions() {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.enforcementSettings,
    queryFn: getEnforcementSettings,
  })
}

export function getEnforcementListQueryOptions(payload?: EnforcementQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.enforcementList(payload),
    queryFn: () => listEnforcement(payload),
    placeholderData: keepPreviousData,
  })
}

export function getEnforcementPreviewQueryOptions() {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.enforcementPreview,
    queryFn: getEnforcementPreview,
  })
}

export function getTenantInvoicesQueryOptions(payload?: TenantInvoicesQuery) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.tenantInvoices(payload),
    queryFn: () => getTenantInvoices(payload),
    placeholderData: keepPreviousData,
  })
}

export function getTenantInvoiceQueryOptions(id: string) {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.tenantInvoice(id),
    queryFn: () => getTenantInvoice({ id }),
    enabled: Boolean(id),
  })
}

export function getTenantLicenceQueryOptions() {
  return queryOptions({
    queryKey: BILLING_QUERY_KEY.tenantLicence,
    queryFn: getTenantLicence,
  })
}

// ─── useQuery hooks ───────────────────────────────────────────────────────────

export function useBillingSummary() {
  return useQuery(getBillingSummaryQueryOptions())
}

export function useBillingPlans(payload?: PlansQuery) {
  return useQuery(getBillingPlansQueryOptions(payload))
}

export function useBillingPlan(code: string) {
  return useQuery(getBillingPlanQueryOptions(code))
}

export function useBillingPriceHistory(payload?: PriceHistoryQuery) {
  return useQuery(getBillingPriceHistoryQueryOptions(payload))
}

export function useInstallationPrice() {
  return useQuery(getInstallationPriceQueryOptions())
}

export function useBillingQuotations(payload?: QuotationsQuery) {
  return useQuery(getBillingQuotationsQueryOptions(payload))
}

export function useBillingQuotation(id: string) {
  return useQuery(getBillingQuotationQueryOptions(id))
}

export function useBillingInvoices(payload?: InvoicesQuery) {
  return useQuery(getBillingInvoicesQueryOptions(payload))
}

export function useBillingInvoice(id: string) {
  return useQuery(getBillingInvoiceQueryOptions(id))
}

export function useBillingPayments(payload?: PaymentsQuery) {
  return useQuery(getBillingPaymentsQueryOptions(payload))
}

export function useBillingPayment(id: string) {
  return useQuery(getBillingPaymentQueryOptions(id))
}

// ─── useMutation hooks ────────────────────────────────────────────────────────

function invalidatePlanQueries() {
  queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.plansRoot })
  queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.priceHistoryRoot })
  queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.summary })
}

export function useCreateBillingPlan() {
  return useMutation({ mutationFn: createBillingPlan, onSuccess: invalidatePlanQueries })
}

export function useUpdateBillingPlan() {
  return useMutation({ mutationFn: updateBillingPlan, onSuccess: invalidatePlanQueries })
}

export function useActivateBillingPlan() {
  return useMutation({ mutationFn: activateBillingPlan, onSuccess: invalidatePlanQueries })
}

export function useDeactivateBillingPlan() {
  return useMutation({ mutationFn: deactivateBillingPlan, onSuccess: invalidatePlanQueries })
}

export function useUpdateInstallationPrice() {
  return useMutation({
    mutationFn: updateInstallationPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.installationPrice })
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.priceHistoryRoot })
    },
  })
}

export function useEnforcementSettings() {
  return useQuery(getEnforcementSettingsQueryOptions())
}

export function useEnforcementList(payload?: EnforcementQuery) {
  return useQuery(getEnforcementListQueryOptions(payload))
}

export function useEnforcementPreview(enabled = true) {
  return useQuery({ ...getEnforcementPreviewQueryOptions(), enabled })
}

export function useUpdateEnforcementSettings() {
  return useMutation({
    mutationFn: updateEnforcementSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.enforcementRoot }),
  })
}

export function useTenantInvoices(payload?: TenantInvoicesQuery) {
  return useQuery(getTenantInvoicesQueryOptions(payload))
}

export function useTenantInvoice(id: string) {
  return useQuery(getTenantInvoiceQueryOptions(id))
}

export function useTenantLicence() {
  return useQuery(getTenantLicenceQueryOptions())
}

function invalidateTenantBilling() {
  queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.tenantRoot })
}

export function usePayTenantInvoiceFromWallet() {
  return useMutation({
    mutationFn: payTenantInvoiceFromWallet,
    onSuccess: () => {
      invalidateTenantBilling()
      queryClient.invalidateQueries({ queryKey: ['dataBundleWalletBalance'] })
    },
  })
}

export function usePayTenantInvoiceByCard() {
  return useMutation({ mutationFn: payTenantInvoiceByCard })
}
