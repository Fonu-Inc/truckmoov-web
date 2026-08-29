import type { ElementType } from "react";
import {
  FileText, Inbox, Mail, Mic, Phone, PhoneCall, Send,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export type CommunicationsTab = {
  to: string;
  label: string;
  icon: ElementType;
  end: boolean;
};

/**
 * Outer tab bar for /messages. One row per child route in shared/lib/route.tsx.
 * `end: true` on every entry because Campaigns is index and the others are
 * leaves relative to each other — without it, /messages/email/settings would
 * light both Email and Campaigns.
 */
export const OUTER_TABS: CommunicationsTab[] = [
  {
    to: "/messages", label: "Campaigns", icon: Send, end: true,
  },
  {
    to: "/messages/whatsapp", label: "WhatsApp Setup", icon: WhatsAppIcon, end: true,
  },
  {
    to: "/messages/email", label: "Email", icon: Mail, end: false,
  },
  {
    to: "/messages/templates", label: "Templates", icon: FileText, end: true,
  },
  {
    to: "/messages/voice", label: "Voice & IVR", icon: Phone, end: true,
  },
  {
    to: "/messages/recordings", label: "Recordings", icon: Mic, end: true,
  },
  {
    to: "/messages/ivr-dashboard", label: "IVR Dashboard", icon: PhoneCall, end: true,
  },
];

export const EMAIL_SUB_TABS: CommunicationsTab[] = [
  {
    to: "/messages/email", label: "Inbox", icon: Inbox, end: true,
  },
  {
    to: "/messages/email/settings", label: "Provider Settings", icon: Mail, end: true,
  },
];
