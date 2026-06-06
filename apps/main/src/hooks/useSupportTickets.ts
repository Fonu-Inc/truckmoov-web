import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

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
  const [tickets] = useState<SupportTicket[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const createTicket = async (_payload: CreateTicketPayload): Promise<SupportTicket | null> => {
    return null;
  };

  const updateTicketStatus = async (_ticketId: string, _status: TicketStatus): Promise<boolean> => {
    return false;
  };

  const escalateTicket = async (
    _ticketId: string,
    _escalateTo: EscalationType,
    _referenceId?: string,
    _notes?: string
  ): Promise<boolean> => {
    return false;
  };

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    updateTicketStatus,
    escalateTicket,
    refetch: () => {},
  };
}

export function useSupportMessages(_ticketId: string | null) {
  const { user } = useAuthStore();
  const [messages] = useState<SupportMessage[]>([]);
  const [isLoading] = useState(false);

  const sendMessage = async (_message: string, _isInternal = false): Promise<boolean> => {
    return false;
  };

  const fetchMessages = useCallback(async () => {}, []);

  return {
    messages,
    isLoading,
    sendMessage,
    refetch: fetchMessages,
  };
}
