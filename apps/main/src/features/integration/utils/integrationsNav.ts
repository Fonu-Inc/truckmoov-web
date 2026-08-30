import type { ElementType } from "react";
import {
  Activity, AlertTriangle, BarChart3, BookOpen,
  Code, Database, Key, Lock, Webhook, Zap,
} from "lucide-react";

export type IntegrationsTab = {
  to: string;
  label: string;
  icon: ElementType;
  end: boolean;
};

/**
 * Outer tab bar for /integrations. Two entries: Developer Portal (all
 * dev-portal sub-routes) and ERP & WMS. `end: false` on Developer Portal
 * because it owns nested routes — otherwise both tabs would light on
 * /integrations/webhooks.
 */
export const OUTER_TABS: IntegrationsTab[] = [
  {
    to: "/integrations", label: "Developer Portal", icon: Code, end: false,
  },
  {
    to: "/integrations/erp-wms", label: "ERP & WMS", icon: Database, end: true,
  },
];

export const DEVELOPER_PORTAL_TABS: IntegrationsTab[] = [
  {
    to: "/integrations", label: "API Keys", icon: Key, end: true,
  },
  {
    to: "/integrations/webhooks", label: "Webhooks", icon: Webhook, end: true,
  },
  {
    to: "/integrations/usage", label: "Usage Analytics", icon: BarChart3, end: true,
  },
  {
    to: "/integrations/docs", label: "API Reference", icon: BookOpen, end: false,
  },
  {
    to: "/integrations/audit", label: "Audit Log", icon: Activity, end: true,
  },
];

export const API_DOCS_TABS: IntegrationsTab[] = [
  {
    to: "/integrations/docs", label: "Endpoints", icon: Code, end: true,
  },
  {
    to: "/integrations/docs/authentication", label: "Authentication", icon: Lock, end: true,
  },
  {
    to: "/integrations/docs/errors", label: "Errors & Limits", icon: AlertTriangle, end: true,
  },
  {
    to: "/integrations/docs/webhooks-guide", label: "Webhooks", icon: Zap, end: true,
  },
];
