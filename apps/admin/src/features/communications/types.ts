export type InboxConversation = {
  id: string;
  driver_name: string;
  driver_phone: string;
  last_message_preview: string;
  last_message_at: string;
  is_locked: boolean;
  window_remaining_hours?: number;
};

export type InboxMessage = {
  id: string;
  direction: "inbound" | "outbound";
  status?: string;
  text: string;
  created_at: string;
};
