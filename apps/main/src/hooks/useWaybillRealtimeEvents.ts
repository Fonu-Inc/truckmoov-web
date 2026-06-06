import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Section 5 — WebSocket Events (Realtime)
 *
 * Maps Postgres row changes on waybill_records and waybill_invoices
 * to named business events.
 */

export type WaybillRealtimeEvent =
  | 'WAYBILL_RECEIVED'
  | 'WAYBILL_EXTRACTION_STARTED'
  | 'WAYBILL_EXTRACTION_COMPLETED'
  | 'WAYBILL_NEEDS_REVIEW'
  | 'INVOICE_DRAFT_CREATED'
  | 'INVOICE_PDF_READY'
  | 'INVOICE_SHARED_STATUS_UPDATED';

export interface WaybillRealtimePayload {
  event: WaybillRealtimeEvent;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
  timestamp: string;
}

type EventHandler = (payload: WaybillRealtimePayload) => void;

interface UseWaybillRealtimeEventsOptions {
  onEvent?: EventHandler;
  showToasts?: boolean;
  onWaybillChange?: () => void;
  onInvoiceChange?: () => void;
}

export function useWaybillRealtimeEvents(_options: UseWaybillRealtimeEventsOptions = {}) {
  // No-op stub: realtime subscriptions removed; API will push events later.
}
