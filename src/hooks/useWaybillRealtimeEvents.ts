import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Section 5 — WebSocket Events (Realtime)
 * 
 * Maps Postgres row changes on waybill_records and waybill_invoices
 * to named business events:
 *   WAYBILL_RECEIVED
 *   WAYBILL_EXTRACTION_STARTED
 *   WAYBILL_EXTRACTION_COMPLETED
 *   WAYBILL_NEEDS_REVIEW
 *   INVOICE_DRAFT_CREATED
 *   INVOICE_PDF_READY
 *   INVOICE_SHARED_STATUS_UPDATED
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
  /** Called on every mapped event */
  onEvent?: EventHandler;
  /** If true, show toast notifications for events (default: true) */
  showToasts?: boolean;
  /** Auto-refresh callbacks — invoked so the consuming page can refetch */
  onWaybillChange?: () => void;
  onInvoiceChange?: () => void;
}

export function useWaybillRealtimeEvents(options: UseWaybillRealtimeEventsOptions = {}) {
  const { onEvent, showToasts = true, onWaybillChange, onInvoiceChange } = options;

  // Stable refs to avoid re-subscribing on every render
  const onEventRef = useRef(onEvent);
  const onWaybillChangeRef = useRef(onWaybillChange);
  const onInvoiceChangeRef = useRef(onInvoiceChange);
  onEventRef.current = onEvent;
  onWaybillChangeRef.current = onWaybillChange;
  onInvoiceChangeRef.current = onInvoiceChange;

  const emit = useCallback((event: WaybillRealtimeEvent, record: Record<string, unknown>, old_record?: Record<string, unknown>) => {
    const payload: WaybillRealtimePayload = {
      event,
      record,
      old_record,
      timestamp: new Date().toISOString(),
    };

    onEventRef.current?.(payload);

    if (showToasts) {
      const toastMessages: Record<WaybillRealtimeEvent, string> = {
        WAYBILL_RECEIVED: `New waybill received${record.driver_name ? ` from ${record.driver_name}` : ''}`,
        WAYBILL_EXTRACTION_STARTED: `Extracting waybill data…`,
        WAYBILL_EXTRACTION_COMPLETED: `Waybill extracted (confidence: ${Math.round(((record.ai_confidence_score as number) || 0) * 100)}%)`,
        WAYBILL_NEEDS_REVIEW: `Waybill requires manual review`,
        INVOICE_DRAFT_CREATED: `Invoice ${record.invoice_number || ''} created`,
        INVOICE_PDF_READY: `Invoice PDF is ready for download`,
        INVOICE_SHARED_STATUS_UPDATED: `Invoice sharing status updated`,
      };
      toast.info(toastMessages[event]);
    }
  }, [showToasts]);

  useEffect(() => {
    const channel = supabase
      .channel('waybill-invoice-realtime')
      // ── Waybill record changes ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waybill_records' },
        (payload) => {
          const rec = payload.new as Record<string, unknown>;
          emit('WAYBILL_RECEIVED', rec);
          onWaybillChangeRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'waybill_records' },
        (payload) => {
          const rec = payload.new as Record<string, unknown>;
          const old = payload.old as Record<string, unknown>;
          const newStatus = rec.status as string;
          const oldStatus = old.status as string;

          // Only emit on actual status transitions
          if (newStatus !== oldStatus) {
            if (newStatus === 'processing') {
              emit('WAYBILL_EXTRACTION_STARTED', rec, old);
            } else if (newStatus === 'extracted') {
              emit('WAYBILL_EXTRACTION_COMPLETED', rec, old);
            } else if (newStatus === 'needs_review') {
              emit('WAYBILL_NEEDS_REVIEW', rec, old);
            }
          }

          onWaybillChangeRef.current?.();
        }
      )
      // ── Invoice changes ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waybill_invoices' },
        (payload) => {
          const rec = payload.new as Record<string, unknown>;
          emit('INVOICE_DRAFT_CREATED', rec);
          onInvoiceChangeRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'waybill_invoices' },
        (payload) => {
          const rec = payload.new as Record<string, unknown>;
          const old = payload.old as Record<string, unknown>;

          // PDF became available
          if (rec.pdf_storage_path && !old.pdf_storage_path) {
            emit('INVOICE_PDF_READY', rec, old);
          }

          // Sharing status changed (sent_via / sent_at populated)
          if (rec.sent_at && !old.sent_at) {
            emit('INVOICE_SHARED_STATUS_UPDATED', rec, old);
          }

          onInvoiceChangeRef.current?.();
        }
      )
      // ── Invoice shares table (additional granularity) ──
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_shares' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const rec = payload.new as Record<string, unknown>;
            emit('INVOICE_SHARED_STATUS_UPDATED', rec);
          }
          onInvoiceChangeRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [emit]);
}
