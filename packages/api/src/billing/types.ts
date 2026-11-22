import type { ServerResponse } from '../lib/types'

export type BillingPage<T> = { items: T[], total: number, page: number, limit: number }
export type BillingPagedResponse<T> = ServerResponse<BillingPage<T>>

export type BillingPlanStatusFilter = 'all' | 'active' | 'inactive'
export type PriceItemType = 'm2m_plan' | 'installation_fee'
export type PriceField = 'year1' | 'renewal' | 'enterprise' | 'owner_operator'
export type QuotationStatus = 'draft' | 'pending_review' | 'sent' | 'accepted' | 'expired' | 'cancelled'
export type QuotationPaymentStatusFilter = 'complete' | 'incomplete'
export type InvoiceKind = 'renewal' | 'first'
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
  productName: string | null
  deviceCount: number
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
  productName: string | null
  deviceCount: number
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
  isRenewal: boolean
  tenantId: string | null
  periodEnd: string | null
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
  params?: { q?: string, status?: InvoiceStatus, kind?: InvoiceKind, page?: number, limit?: number }
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

// ─── Payment enforcement (grace and automatic suspension) ────────────────────

export type EnforcementStage = 'current' | 'in_grace' | 'past_grace'
export type EnforcementCause = 'manual' | 'non_payment'
export type EnforcementCascadeStatus = 'pending' | 'complete' | 'partial' | 'restoring' | 'restore_partial'
export type EnforcementNoticeKind = 'due_today' | 'grace_daily' | 'final' | 'suspended' | 'restored'

export type EnforcementSettings = {
  graceDays: number
  renewalLeadDays: number
  autoSuspendEnabled: boolean
  autoSuspendCapPerRun: number
  paused: boolean
  updatedAt: string | null
  updatedBy: string | null
  limits: {
    graceDays: { min: number, max: number }
    renewalLeadDays: { min: number, max: number }
    autoSuspendCapPerRun: { min: number, max: number }
  }
}

export type EnforcementSettingsUpdate = {
  graceDays?: number
  renewalLeadDays?: number
  autoSuspendEnabled?: boolean
  autoSuspendCapPerRun?: number
  paused?: boolean
  reason: string
}

export type EnforcementRow = {
  tenantId: string
  tenantName: string
  dueDate: string
  daysOverdue: number
  graceEndsAt: string
  graceDaysLeft: number | null
  stage: EnforcementStage
  amountOwedNgn: number
  sources: string[]
  items: number
  suspended: boolean
  suspensionCause: EnforcementCause | null
  suspendedAt: string | null
  reason: string | null
  cascadeStatus: EnforcementCascadeStatus | null
  lastNoticeKind: EnforcementNoticeKind | null
  lastNoticeAt: string | null
  hasContact: boolean
}

export type EnforcementList = {
  items: EnforcementRow[]
  page: number
  pageSize: number
  total: number
  summary: {
    inGrace: number
    pastGrace: number
    suspendedNonPayment: number
    suspendedManual: number
    owedNgn: number
  }
}

export type EnforcementQuery = {
  params?: {
    stage?: 'all' | EnforcementStage
    suspended?: boolean
    q?: string
    page?: number
    pageSize?: number
  }
}

export type EnforcementAssetCounts = {
  users: number
  devices: number
  sims: number
  vehicles: number
  shareLinks: number
}

export type EnforcementPreview = {
  generatedAt: string
  today: string
  settings: Pick<EnforcementSettings, 'graceDays' | 'autoSuspendEnabled' | 'autoSuspendCapPerRun' | 'paused'>
  wouldNotify: {
    tenantId: string
    tenantName: string
    kind: 'due_today' | 'grace_daily' | 'final'
    daysLeft: number | null
    amountOwedNgn: number
    alreadySent: boolean
  }[]
  wouldSuspend: {
    tenantId: string
    tenantName: string
    dueDate: string
    daysOverdue: number
    amountOwedNgn: number
    reason: string
    assets: EnforcementAssetCounts
  }[]
  deferred: {
    tenantId: string
    tenantName: string
    why: 'waived' | 'no_notice_yet' | 'no_contact' | 'capped'
    label: string
  }[]
  totalEligible: number
  cappedCount: number
  notes: { sims: string, apiKeys: string, scope: string }
}

export type EnforcementSettingsResponse = ServerResponse<EnforcementSettings>
export type EnforcementListResponse = ServerResponse<EnforcementList>
export type EnforcementPreviewResponse = ServerResponse<EnforcementPreview>

// ─── Tenant billing (what the signed-in tenant sees of its own billing) ──────

export type TenantInvoiceKind = 'renewal' | 'first'
export type TenantInvoiceStatus = 'issued' | 'partially_paid' | 'paid' | 'overdue'
/** open, paid and all are scopes; the rest are exact states, pending being issued with nothing paid. */
export type TenantInvoiceFilter = 'open' | 'paid' | 'all' | 'pending' | 'partially_paid' | 'overdue'
export type TenantPaymentMethod = PaymentMethod | 'wallet'
export type TenantPaymentStatus = 'successful' | 'pending' | 'failed' | 'refunded'
export type TenantQuotationStatus =
  | 'draft'
  | 'sent'
  | 'awaiting_decision'
  | 'accepted'
  | 'paid'
  | 'expired'
  | 'cancelled'

export type TenantInvoice = {
  id: string
  number: string
  kind: TenantInvoiceKind
  status: TenantInvoiceStatus
  issueDate: string
  dueDate: string
  totalNgn: number
  amountPaidNgn: number
  outstandingNgn: number
  daysOverdue: number
  graceEndsOn: string | null
  payable: boolean
  periodEnd: string | null
  planName: string | null
  deviceCount: number
  billingPeriod: string
  quotationNumber: string | null
}

export type TenantInvoiceLine = BillingLine

export type TenantInvoicePayment = {
  reference: string
  method: TenantPaymentMethod | null
  paidAt: string | null
  amountNgn: number
}

export type TenantInvoiceDetail = TenantInvoice & {
  subtotalNgn: number
  discountNgn: number
  taxNgn: number
  taxRateBp: number
  lines: TenantInvoiceLine[]
  payments: TenantInvoicePayment[]
}

export type TenantInvoiceList = {
  items: TenantInvoice[]
  openTotalNgn: number
  nextDueDate: string | null
  total: number
  page: number
  pageSize: number
}

export type TenantInvoicesQuery = {
  params?: { status?: TenantInvoiceFilter, q?: string, page?: number, pageSize?: number }
}

export type TenantLicence = {
  planCode: string
  planName: string
  deviceCount: number
  periodStart: string
  periodEnd: string
  daysLeft: number
  status: 'active' | 'renewed' | 'ended'
  renewalInvoiceId: string | null
  pricePerDeviceNgn: number | null
  renewalPricePerDeviceNgn: number | null
  totalPaidNgn: number | null
  validityDays: number | null
  invoiceNumber: string | null
  devicesInUse: number | null
  vehiclesInUse: number | null
  simsInUse: number | null
}

export type TenantInvoicePayWallet = {
  invoice: TenantInvoice
  paidFromWalletNgn: number
  newPeriodEnd: string | null
}

export type TenantInvoicePayCard = {
  /** Null when the server settled the invoice without a hosted checkout. */
  authorizationUrl: string | null
  reference: string
  amountNgn: number
  newPeriodEnd?: string | null
  paid?: boolean
}

export type TenantQuotation = {
  id: string
  number: string
  date: string
  planName: string
  deviceCount: number
  description: string
  purpose: string
  category: 'Onboarding'
  status: TenantQuotationStatus
  relatedRequest: string | null
  totalNgn: number
  paymentRef: string | null
  operationalOutcome: string
}

export type TenantQuotationDetail = TenantQuotation & {
  invoiceNumber: string | null
  validUntil: string
  subtotalNgn: number
  discountNgn: number
  taxNgn: number
  taxRateBp: number
  lines: BillingLine[]
}

export type TenantQuotationList = { items: TenantQuotation[], total: number, page: number, pageSize: number }

export type TenantQuotationsQuery = {
  params?: { q?: string, status?: TenantQuotationStatus, page?: number, pageSize?: number }
}

export type TenantPayment = {
  id: string
  reference: string
  date: string
  planName: string
  deviceCount: number
  amountNgn: number
  method: TenantPaymentMethod | null
  status: TenantPaymentStatus
  invoiceNumber: string | null
  quotationNumber: string | null
  paidFor: string
}

export type TenantPaymentDetail = TenantPayment & {
  relatedInvoice: TenantInvoiceDetail | null
  relatedQuotation: TenantQuotationDetail | null
}

export type TenantPaymentList = { items: TenantPayment[], total: number, page: number, pageSize: number }

export type TenantPaymentsQuery = {
  params?: {
    q?: string
    status?: TenantPaymentStatus
    method?: TenantPaymentMethod
    from?: string
    to?: string
    page?: number
    pageSize?: number
  }
}

export type TenantBillingSummary = {
  outstandingNgn: number
  nextDueDate: string | null
  paidThisYearNgn: number
  walletBalanceNgn: number
}

export type TenantSpendMonth = { month: string, invoicedNgn: number, paidNgn: number }
export type TenantSpendCategory = { name: 'Licensing' | 'Installation', valueNgn: number }
export type TenantOutstandingPoint = { date: string, invoiceNumber: string, outstandingNgn: number }

export type TenantBillingOverview = {
  summary: TenantBillingSummary
  spendTrend: TenantSpendMonth[]
  spendByCategory: TenantSpendCategory[]
  outstandingTrend: TenantOutstandingPoint[]
}

export type TenantBillingActivityEvent =
  | 'Invoice Issued'
  | 'Payment Received'
  | 'Quotation Sent'
  | 'Quotation Accepted'
  | 'Licence Renewed'
  | 'New Device Requested'
  | 'Vehicles Added'
  | 'Devices Added'
  | 'SIMs Added'
  | 'Installation Completed'
  | 'Service Removed'

export type TenantBillingActivity = {
  id: string
  date: string
  event: TenantBillingActivityEvent
  resource: string
  impactNgn: number | null
}

export type TenantBillingActivityList = {
  items: TenantBillingActivity[]
  events: string[]
  total: number
  page: number
  pageSize: number
}

export type TenantBillingActivityQuery = {
  params?: { q?: string, event?: string, page?: number, pageSize?: number }
}

export type TenantInvoiceListResponse = ServerResponse<TenantInvoiceList>
export type TenantInvoiceDetailResponse = ServerResponse<TenantInvoiceDetail>
export type TenantLicenceResponse = ServerResponse<TenantLicence | null>
export type TenantInvoicePayWalletResponse = ServerResponse<TenantInvoicePayWallet>
export type TenantInvoicePayCardResponse = ServerResponse<TenantInvoicePayCard>
export type TenantQuotationListResponse = ServerResponse<TenantQuotationList>
export type TenantQuotationDetailResponse = ServerResponse<TenantQuotationDetail>
export type TenantPaymentListResponse = ServerResponse<TenantPaymentList>
export type TenantPaymentDetailResponse = ServerResponse<TenantPaymentDetail>
export type TenantBillingOverviewResponse = ServerResponse<TenantBillingOverview>
export type TenantBillingActivityResponse = ServerResponse<TenantBillingActivityList>
