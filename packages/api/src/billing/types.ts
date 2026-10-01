import type { ServerResponse } from '../lib/types'

export type BillingPage<T> = { items: T[], total: number, page: number, limit: number }
export type BillingPagedResponse<T> = ServerResponse<BillingPage<T>>

export type BillingPlanStatusFilter = 'all' | 'active' | 'inactive'
export type PriceItemType = 'm2m_plan' | 'installation_fee'
export type PriceField = 'year1' | 'renewal' | 'enterprise' | 'owner_operator'
export type QuotationStatus = 'draft' | 'pending_review' | 'sent' | 'accepted' | 'expired' | 'cancelled'
export type QuotationPaymentStatusFilter = 'complete' | 'incomplete'
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'requires_review' | 'refunded'
export type QuotationPaymentStatus = PaymentStatus
export type PaymentMethod = 'card' | 'bank_transfer' | 'mtn_momo' | 'other'
export type BillingLineKind = 'plan' | 'installation'

// ─── Plans ────────────────────────────────────────────────────────────────────

export type PlanView = {
  code: string
  name: string
  description: string
  perDeviceYear1Ngn: number
  perDeviceRenewalNgn: number
  validityDays: number
  components: string[]
  isActive: boolean
  sortOrder: number
  lastPriceChangedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PriceChangeView = {
  id: string
  itemType: PriceItemType
  itemRef: string
  field: PriceField
  oldPriceNgn: number
  newPriceNgn: number
  effectiveDate: string
  reason: string
  changedByUserId: string
  changedByName: string
  createdAt: string
}

export type PlansQuery = {
  params?: { q?: string, status?: BillingPlanStatusFilter, page?: number, limit?: number }
}
export type PlanCodePayload = { code: string }

export type CreatePlanBody = {
  code: string
  name: string
  description?: string
  perDeviceYear1Ngn: number
  perDeviceRenewalNgn: number
  validityDays?: number
  components?: string[]
  isActive?: boolean
}
export type CreatePlanPayload = { data: CreatePlanBody }

export type UpdatePlanBody = {
  name?: string
  description?: string
  validityDays?: number
  components?: string[]
  perDeviceYear1Ngn?: number
  perDeviceRenewalNgn?: number
  reason?: string
  effectiveDate?: string
}
export type UpdatePlanPayload = { code: string, data: UpdatePlanBody }

export type PlansResponse = BillingPagedResponse<PlanView>
export type PlanDetailResponse = ServerResponse<{ plan: PlanView, priceHistory: PriceChangeView[] }>
export type PlanActionResponse = ServerResponse<{ plan: PlanView }>
export type UpdatePlanResponse = ServerResponse<{ plan: PlanView, priceChanges: PriceChangeView[] }>

// ─── Price history & installation price ───────────────────────────────────────

export type PriceHistoryQuery = {
  params?: { itemType?: PriceItemType, itemRef?: string, page?: number, limit?: number }
}
export type PriceHistoryResponse = BillingPagedResponse<PriceChangeView>

export type InstallationPrice = {
  enterpriseNgn: number
  ownerOperatorNgn: number
  lastChangedAt: string | null
  priceHistory: PriceChangeView[]
}
export type InstallationPriceResponse = ServerResponse<InstallationPrice>

export type UpdateInstallationPriceBody = {
  enterpriseNgn: number
  ownerOperatorNgn: number
  reason?: string
  effectiveDate?: string
}
export type UpdateInstallationPricePayload = { data: UpdateInstallationPriceBody }

// ─── Summary ──────────────────────────────────────────────────────────────────

export type BillingSummary = {
  activePlans: number
  quotationsCount: number
  outstandingNgn: number
  collectedNgn: number
}
export type BillingSummaryResponse = ServerResponse<BillingSummary>

// ─── Shared line / payment shapes ─────────────────────────────────────────────

export type BillingLine = {
  kind: BillingLineKind
  name: string
  description: string | null
  quantity: number
  unitPriceNgn: number
  lineTotalNgn: number
  validityDays: number | null
  components: string[]
}

export type BillingIdPayload = { id: string }

// ─── Quotations ───────────────────────────────────────────────────────────────

export type QuotationRow = {
  id: string
  number: string
  customerName: string
  customerType: string
  billingEmail: string
  status: QuotationStatus
  createdAt: string
  validUntil: string
  subtotalNgn: number
  discountNgn: number
  taxRateBp: number
  taxNgn: number
  totalNgn: number
  paidNgn: number
  outstandingNgn: number
  paymentComplete: boolean
  lineCount: number
}

export type QuotationPaymentEntry = {
  reference: string
  amountNgn: number
  status: PaymentStatus
  paidAt: string | null
}

export type QuotationDetail = QuotationRow & {
  lines: BillingLine[]
  payments: QuotationPaymentEntry[]
}

export type QuotationsQuery = {
  params?: {
    q?: string
    status?: QuotationStatus
    paymentStatus?: QuotationPaymentStatusFilter
    page?: number
    limit?: number
  }
}
export type QuotationsResponse = BillingPagedResponse<QuotationRow>
export type QuotationResponse = ServerResponse<QuotationDetail>

// ─── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceRow = {
  id: string
  number: string
  quotationId: string | null
  quotationNumber: string | null
  customerName: string
  customerType: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  subtotalNgn: number
  discountNgn: number
  taxNgn: number
  totalNgn: number
  amountPaidNgn: number
  outstandingNgn: number
  emailedAt: string | null
}

export type InvoicePaymentEntry = {
  reference: string
  method: PaymentMethod | null
  amountNgn: number
  paidAt: string | null
  status: PaymentStatus
}

export type InvoiceDetail = InvoiceRow & {
  billingEmail: string
  taxRateBp: number
  lines: BillingLine[]
  payments: InvoicePaymentEntry[]
}

export type InvoicesQuery = {
  params?: { q?: string, status?: InvoiceStatus, page?: number, limit?: number }
}
export type InvoicesResponse = BillingPagedResponse<InvoiceRow>
export type InvoiceResponse = ServerResponse<InvoiceDetail>

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentRow = {
  id: string
  reference: string
  customerName: string
  quotationId: string | null
  quotationNumber: string | null
  invoiceId: string | null
  invoiceNumber: string | null
  productName: string
  deviceCount: number
  amountNgn: number
  method: PaymentMethod | null
  status: PaymentStatus
  paidAt: string | null
  createdAt: string
}

export type PaymentBreakdown = {
  planCode: string
  planName: string
  deviceCount: number
  perDeviceNgn: number
  devicesNgn: number
  installationPerDeviceNgn: number
  installationNgn: number
  subtotalNgn: number
  taxRateBp: number
  taxNgn: number
  totalNgn: number
}

export type PaymentDetail = PaymentRow & {
  provider: string
  billingEmail: string
  note: string | null
  autoReconciled: boolean
  breakdown: PaymentBreakdown | null
}

export type PaymentsQuery = {
  params?: { q?: string, status?: PaymentStatus, method?: PaymentMethod, page?: number, limit?: number }
}
export type PaymentsResponse = BillingPagedResponse<PaymentRow>
export type PaymentResponse = ServerResponse<PaymentDetail>
