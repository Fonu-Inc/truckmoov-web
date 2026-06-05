import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLogs';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_tenant' | 'escalated' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'device_tracking' | 'sim_connectivity' | 'messaging' | 'billing' | 'account_access' | 'other';
export type ContextType = 'none' | 'device' | 'sim' | 'vehicle' | 'whatsapp' | 'billing';
export type EscalationType = 'fleetpro_internal' | 'fonu_connectivity' | 'vendor_installer';

export interface SupportTicket {
  id: string;
  tenantId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  contextType: ContextType;
  contextId?: string;
  contextSnapshot?: Record<string, unknown>;
  escalatedTo?: EscalationType;
  escalatedReferenceId?: string;
  escalationNotes?: string;
  escalatedAt?: string;
  escalatedBy?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderRole: string;
  message: string;
  attachments?: unknown[];
  isInternal: boolean;
  createdAt: string;
}

export interface CreateTicketPayload {
  category: TicketCategory;
  subject: string;
  description: string;
  priority?: TicketPriority;
  contextType?: ContextType;
  contextId?: string;
  contextSnapshot?: Record<string, unknown>;
}

export function useSupportTickets() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  const tenantId = user?.tenantId ?? null;
  const isPlatformAdmin = user?.role === 'platform_admin';

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isPlatformAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else if (!isPlatformAdmin) {
        setTickets([]);
        setIsLoading(false);
        return;
      }

      // Apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && !isPlatformAdmin) {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: SupportTicket[] = (data || []).map((t) => ({
        id: t.id,
        tenantId: t.tenant_id,
        category: t.category as TicketCategory,
        subject: t.subject,
        description: t.description,
        status: t.status as TicketStatus,
        priority: t.priority as TicketPriority,
        contextType: t.context_type as ContextType,
        contextId: t.context_id || undefined,
        contextSnapshot: t.context_snapshot as Record<string, unknown> | undefined,
        escalatedTo: t.escalated_to as EscalationType | undefined,
        escalatedReferenceId: t.escalated_reference_id || undefined,
        escalationNotes: t.escalation_notes || undefined,
        escalatedAt: t.escalated_at || undefined,
        escalatedBy: t.escalated_by || undefined,
        assignedTo: t.assigned_to || undefined,
        createdBy: t.created_by,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        resolvedAt: t.resolved_at || undefined,
        closedAt: t.closed_at || undefined,
      }));

      setTickets(mapped);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, isPlatformAdmin, orgScope.multiStakeholderEnabled, stableAssetOrgIds]);

  const createTicket = async (payload: CreateTicketPayload): Promise<SupportTicket | null> => {
    if (!user) {
      toast.error('You must be logged in to create a ticket');
      return null;
    }

    try {
      // Map category to match DB enum (billing -> billing_subscription)
      const dbCategory = payload.category === 'billing' ? 'billing_subscription' : payload.category;
      
      const insertData = {
        tenant_id: tenantId,
        category: dbCategory as 'device_tracking' | 'sim_connectivity' | 'messaging' | 'billing_subscription' | 'account_access' | 'other',
        subject: payload.subject,
        description: payload.description,
        priority: (payload.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        context_type: (payload.contextType || 'none') as 'none' | 'device' | 'sim' | 'vehicle' | 'whatsapp' | 'billing',
        context_id: payload.contextId || null,
        context_snapshot: payload.contextSnapshot ? JSON.parse(JSON.stringify(payload.contextSnapshot)) : null,
        created_by: user.id,
      };

      const { data, error: insertError } = await supabase
        .from('support_tickets')
        .insert([insertData])
        .select()
        .single();

      if (insertError) throw insertError;

      const newTicket: SupportTicket = {
        id: data.id,
        tenantId: data.tenant_id,
        category: data.category as TicketCategory,
        subject: data.subject,
        description: data.description,
        status: data.status as TicketStatus,
        priority: data.priority as TicketPriority,
        contextType: data.context_type as ContextType,
        contextId: data.context_id || undefined,
        contextSnapshot: data.context_snapshot as Record<string, unknown> | undefined,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTickets((prev) => [newTicket, ...prev]);
      
      // Audit log: ticket created
      await logActivity({
        entityType: 'support_ticket',
        entityId: data.id,
        tenantId: tenantId,
        action: 'created',
        description: `Support ticket created: ${payload.subject}`,
        actorId: user.id,
        actorName: user.name,
        metadata: { category: payload.category, priority: payload.priority || 'medium' },
      });
      
      toast.success('Support ticket created successfully');
      return newTicket;
    } catch (err) {
      console.error('Error creating support ticket:', err);
      toast.error('Failed to create support ticket');
      return null;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<boolean> => {
    try {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (updateError) throw updateError;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
      );

      // Audit log: status changed
      const ticket = tickets.find((t) => t.id === ticketId);
      await logActivity({
        entityType: 'support_ticket',
        entityId: ticketId,
        tenantId: ticket?.tenantId || tenantId,
        action: 'status_updated',
        description: `Ticket status changed to ${status}`,
        actorId: user?.id || '',
        actorName: user?.name || 'Unknown',
        metadata: { newStatus: status },
      });

      toast.success('Ticket status updated');
      return true;
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast.error('Failed to update ticket status');
      return false;
    }
  };

  const escalateTicket = async (
    ticketId: string,
    escalateTo: EscalationType,
    referenceId?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!isPlatformAdmin) {
      toast.error('Only platform admins can escalate tickets');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: 'escalated',
          escalated_to: escalateTo,
          escalated_reference_id: referenceId || null,
          escalation_notes: notes || null,
          escalated_at: new Date().toISOString(),
          escalated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: 'escalated' as TicketStatus,
                escalatedTo: escalateTo,
                escalatedReferenceId: referenceId,
                escalationNotes: notes,
                escalatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      // Audit log: ticket escalated
      const ticket = tickets.find((t) => t.id === ticketId);
      await logActivity({
        entityType: 'support_ticket',
        entityId: ticketId,
        tenantId: ticket?.tenantId || '',
        action: 'escalated',
        description: `Ticket escalated to ${escalateTo.replace(/_/g, ' ')}`,
        actorId: user?.id || '',
        actorName: user?.name || 'Unknown',
        metadata: { escalateTo, referenceId: referenceId || null, notes: notes || null },
      });

      toast.success(`Ticket escalated to ${escalateTo.replace('_', ' ')}`);
      return true;
    } catch (err) {
      console.error('Error escalating ticket:', err);
      toast.error('Failed to escalate ticket');
      return false;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    updateTicketStatus,
    escalateTicket,
    refetch: fetchTickets,
  };
}

export function useSupportMessages(ticketId: string | null) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isPlatformAdmin = user?.role === 'platform_admin';

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter out internal messages for non-platform admins
      const filtered = (data || []).filter((m) => isPlatformAdmin || !m.is_internal);

      const mapped: SupportMessage[] = filtered.map((m) => ({
        id: m.id,
        ticketId: m.ticket_id,
        senderId: m.sender_id,
        senderName: m.sender_name || undefined,
        senderRole: m.sender_role,
        message: m.message,
        attachments: m.attachments as unknown[] | undefined,
        isInternal: m.is_internal,
        createdAt: m.created_at,
      }));

      setMessages(mapped);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, isPlatformAdmin]);

  const sendMessage = async (message: string, isInternal = false): Promise<boolean> => {
    if (!ticketId || !user) return false;

    try {
      // Map role to valid DB enum (driver is not in support_messages enum)
      const dbRole = user.role === 'driver' ? 'dispatcher' : user.role;
      
      const insertData = {
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: dbRole as 'platform_admin' | 'tenant_admin' | 'operations_manager' | 'supervisor' | 'dispatcher' | 'viewer_finance' | 'installer',
        message,
        is_internal: isInternal && isPlatformAdmin,
      };

      const { data: insertedData, error } = await supabase.from('support_messages').insert([insertData]).select().single();

      if (error) throw error;

      // Audit log: message sent
      await logActivity({
        entityType: 'support_ticket',
        entityId: ticketId,
        tenantId: user.tenantId || '',
        action: isInternal ? 'internal_note_added' : 'message_sent',
        description: isInternal ? 'Internal note added' : 'Message sent on ticket',
        actorId: user.id,
        actorName: user.name,
        metadata: { messageId: insertedData?.id, isInternal },
      });

      await fetchMessages();
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`support_messages_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    refetch: fetchMessages,
  };
}



