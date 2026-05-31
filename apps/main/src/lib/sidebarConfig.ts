import {Receipt, Database, LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Package,
  BarChart3,
  Settings,
  Cpu,
  CreditCard,
  Building2,
  Shield, ShieldCheck, ShieldHalf, ClipboardCheck,
  Wifi,
  Bell,
  Radio,
  Wrench,
  Headphones,
  Code2,
  Inbox,
  Send,
  Gauge,
  FileText,
  DollarSign,
  Globe,
  Network,
  MapPinned,
  Handshake,
  User,
  BellRing,
  TrendingUp,
  Leaf,
  Telescope } from "lucide-react";
import type { User as AppUser } from "@/types";
import type { OrgMembership } from "@/types/orgRoles";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeKey?: string;
}

export interface SidebarNavGroup {
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  items: SidebarNavItem[];
}

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export interface SidebarConfig {
  /** Label shown under logo, e.g. "Enterprise" */
  orgTypeLabel: string;
  /** Home route for this org type (used for redirect on switch) */
  homeRoute: string;
  /** The nav entries */
  entries: SidebarEntry[];
}

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

// ─── Module-to-Route mapping for role trimming ────────────────
// Each sidebar item is tagged with a module key so role-based trimming can
// hide items the user's role doesn't have access to.
interface TaggedNavItem extends SidebarNavItem {
  /** Module key used for role-based visibility filtering */
  moduleTag?: ModuleTag;
}

interface TaggedNavGroup extends SidebarNavGroup {
  moduleTag?: ModuleTag;
  items: TaggedNavItem[];
}

type TaggedEntry = TaggedNavItem | TaggedNavGroup;

/**
 * Module tags used to map sidebar items to role capabilities.
 * These are internal and not exposed outside sidebarConfig.
 */
type ModuleTag =
  | 'jobs'
  | 'job_offers'
  | 'dispatch'
  | 'fleet'
  | 'drivers'
  | 'devices'
  | 'sims'
  | 'maintenance'
  | 'fuel'
  | 'compliance'
  | 'analytics'
  | 'communications'
  | 'integrations'
  | 'settings'
  | 'wallet'
  | 'invoices'
  | 'subscription_invoices'
  | 'live_map'
  | 'zones'
  | 'installation'
  | 'notifications'
  | 'profile'
  | 'overview'
  | 'providers'
  | 'performance'
  | 'settlements'
  | 'contracts'
  | 'reports'
  | 'network_members'
  | 'network_fleet'
  | 'sub_orgs'
  | 'documents'
  | 'sustainability'
  | 'operations_center';

/**
 * Which module tags each role is allowed to see.
 * ADMIN sees everything (no filtering applied).
 * Other roles see only the listed tags.
 */
const ROLE_ALLOWED_MODULES: Record<string, ModuleTag[] | 'ALL'> = {
  ADMIN: 'ALL',

  OPERATIONS_MANAGER: [
    'overview', 'jobs', 'job_offers', 'dispatch', 'fleet', 'drivers', 'devices',
    'sims', 'installation', 'maintenance', 'fuel', 'compliance', 'live_map',
    'zones', 'analytics', 'performance', 'communications', 'reports',
    'network_members', 'network_fleet', 'documents', 'sustainability',
  ],

  DISPATCHER: [
    'operations_center', 'jobs', 'job_offers', 'dispatch', 'live_map', 'zones',
    'drivers', 'communications', 'notifications',
  ],

  FINANCE: [
    'overview', 'analytics', 'performance', 'wallet', 'invoices', 'subscription_invoices',
    'settlements', 'reports', 'fleet',
  ],

  VIEWER: [
    'overview', 'jobs', 'fleet', 'drivers', 'devices', 'live_map', 'zones',
    'analytics', 'performance', 'reports',
  ] };

/**
 * Filter sidebar entries by role. Returns a new array with only allowed items.
 */
function filterEntriesByRole(entries: TaggedEntry[], roleKeys: string[]): SidebarEntry[] {
  // Resolve best role
  const PRIORITY = ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER'];
  const bestRole = PRIORITY.find((r) => roleKeys.includes(r)) ?? 'VIEWER';
  const allowed = ROLE_ALLOWED_MODULES[bestRole];

  // ADMIN sees everything
  if (allowed === 'ALL') return entries;

  return entries
    .map((entry): SidebarEntry | null => {
      if (isNavGroup(entry)) {
        // If group itself has a tag, check it
        const taggedGroup = entry as TaggedNavGroup;
        if (taggedGroup.moduleTag && !allowed.includes(taggedGroup.moduleTag)) return null;
        // Filter children
        const filteredItems = taggedGroup.items.filter(
          (item) => !item.moduleTag || allowed.includes(item.moduleTag)
        );
        if (filteredItems.length === 0) return null;
        return { ...entry, items: filteredItems };
      }
      const taggedItem = entry as TaggedNavItem;
      if (taggedItem.moduleTag && !allowed.includes(taggedItem.moduleTag)) return null;
      return entry;
    })
    .filter(Boolean) as SidebarEntry[];
}

// ─── Enterprise ────────────────────────────────────────────────
const enterpriseEntries: TaggedEntry[] = [
  { label: "Logistics Overview", href: "/enterprise", icon: LayoutDashboard, moduleTag: 'overview' },
  { label: "Shipments", href: "/admin/jobs", icon: Package, moduleTag: 'jobs' },
  { label: "Fleet Providers", href: "/admin/fleet", icon: Truck, moduleTag: 'providers' },
  { label: "Devices", href: "/admin/devices", icon: Cpu, moduleTag: 'devices' },
  { label: "IoT SIMs", href: "/admin/sims", icon: Wifi, moduleTag: 'sims' },
  { label: "Data Bundles", href: "/admin/data-bundles", icon: Database, moduleTag: 'sims' },
  
  { label: "Live Tracking", href: "/admin/map", icon: MapPin, moduleTag: 'live_map' },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    moduleTag: 'communications',
    items: [
      { label: "Messaging Center", href: "/admin/messages", icon: Send },
      { label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox },
    ] },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, moduleTag: 'reports' },
  { label: "Integrations", href: "/admin/integrations", icon: Code2, moduleTag: 'integrations' },
  { label: "Organization Settings", href: "/admin/settings", icon: Settings, moduleTag: 'settings' },
];

// ─── Fleet Provider ────────────────────────────────────────────
const fleetProviderEntries: TaggedEntry[] = [
  { label: "Fleet Operations", href: "/admin", icon: LayoutDashboard, moduleTag: 'overview' },
  { label: "Dispatch", href: "/admin/jobs", icon: Package, moduleTag: 'dispatch' },
  { label: "Vehicles", href: "/admin/fleet", icon: Truck, moduleTag: 'fleet' },
  { label: "Drivers", href: "/admin/drivers", icon: Users, moduleTag: 'drivers' },
  { label: "Devices", href: "/admin/devices", icon: Cpu, moduleTag: 'devices' },
  { label: "Installation", href: "/admin/installation", icon: Wrench, moduleTag: 'installation' },
  { label: "IoT SIMs", href: "/admin/sims", icon: Wifi, moduleTag: 'sims' },
  { label: "Data Bundles", href: "/admin/data-bundles", icon: Database, moduleTag: 'sims' },
  { label: "Live Map & Zones", href: "/admin/map", icon: MapPinned, moduleTag: 'live_map' },
  { label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt, moduleTag: 'invoices' },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    moduleTag: 'communications',
    items: [
      { label: "Messaging Center", href: "/admin/messages", icon: Send },
      { label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox },
    ] },
  { label: "Reports", href: "/admin/reports", icon: FileText, moduleTag: 'reports' },
  { label: "Sustainability", href: "/admin/sustainability", icon: Leaf, moduleTag: 'sustainability' },
  { label: "Integrations", href: "/admin/integrations", icon: Code2, moduleTag: 'integrations' },
  { label: "Organization Settings", href: "/admin/settings", icon: Settings, moduleTag: 'settings' },
];

// ─── Aggregator ────────────────────────────────────────────────
const aggregatorEntries: TaggedEntry[] = [
  { label: "Network Overview", href: "/aggregator", icon: LayoutDashboard, moduleTag: 'overview' },
  { label: "Job Coordination", href: "/admin/jobs", icon: Package, moduleTag: 'jobs' },
  { label: "Network Members", href: "/admin/drivers", icon: Users, moduleTag: 'network_members' },
  { label: "Network Fleet", href: "/admin/fleet", icon: Truck, moduleTag: 'network_fleet' },
  { label: "Device Setup Requests", href: "/admin/devices", icon: Cpu, moduleTag: 'devices' },
  { label: "Data Bundles", href: "/admin/data-bundles", icon: Database, moduleTag: 'sims' },
  { label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt, moduleTag: 'invoices' },
  { label: "Zones", href: "/admin/map", icon: MapPinned, moduleTag: 'zones' },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    moduleTag: 'communications',
    items: [
      { label: "Messaging Center", href: "/admin/messages", icon: Send },
      { label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox },
    ] },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, moduleTag: 'reports' },
  { label: "Sustainability", href: "/admin/sustainability", icon: Leaf, moduleTag: 'sustainability' },
  { label: "Integrations", href: "/admin/integrations", icon: Code2, moduleTag: 'integrations' },
  { label: "Organization Settings", href: "/admin/settings", icon: Settings, moduleTag: 'settings' },
];

// ─── Owner-Operator ────────────────────────────────────────────
const ownerOperatorEntries: TaggedEntry[] = [
  { label: "My Overview", href: "/owner-operator", icon: LayoutDashboard, moduleTag: 'overview' },
  { label: "My Jobs", href: "/owner-operator/jobs", icon: Package, moduleTag: 'jobs' },
  { label: "Job Offers", href: "/admin/job-offers", icon: Inbox, moduleTag: 'job_offers', badgeKey: "jobOffers" },
  { label: "My Vehicles", href: "/owner-operator/vehicles", icon: Truck, moduleTag: 'fleet' },
  { label: "Devices", href: "/admin/devices", icon: Cpu, moduleTag: 'devices' },
  { label: "IoT SIMs", href: "/admin/sims", icon: Wifi, moduleTag: 'sims' },
  { label: "Data Bundles", href: "/admin/data-bundles", icon: Database, moduleTag: 'sims' },
  { label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt, moduleTag: 'invoices' },
  { label: "Documents", href: "/owner-operator/documents", icon: FileText, moduleTag: 'documents' },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    moduleTag: 'communications',
    items: [
      { label: "Messaging Center", href: "/admin/messages", icon: Send },
      { label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox },
    ] },
  { label: "Profile", href: "/admin/settings", icon: User, moduleTag: 'profile' },
];

// ─── Platform Admin ────────────────────────────────────────────
const platformAdminSidebar: SidebarConfig = {
  orgTypeLabel: "Platform Admin",
  homeRoute: "/",
  entries: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tenants", href: "/tenants", icon: Building2 },
    { label: "Devices", href: "/devices", icon: Cpu },
    { label: "IoT SIMs", href: "/sims", icon: Wifi },
    { label: "Data Bundles", href: "/data-bundles", icon: Database },
    
    { label: "Simulator", href: "/simulator", icon: Radio },
    
    { label: "Channel Providers", href: "/communications", icon: Bell },
    { label: "Messaging Center", href: "/messaging", icon: Send },
    { label: "Billing", href: "/billing", icon: CreditCard },
    { label: "Security", href: "/security", icon: ShieldHalf },
    { label: "Compliance & Audit", href: "/compliance-audit", icon: ShieldCheck },
    { label: "Settings", href: "/settings", icon: Settings },
  ] };

// ─── Supervisor ────────────────────────────────────────────────
const supervisorSidebar: SidebarConfig = {
  orgTypeLabel: "Supervisor",
  homeRoute: "/supervisor",
  entries: [
    { label: "Operations Center", href: "/supervisor", icon: LayoutDashboard },
    { label: "Dispatch", href: "/supervisor/dispatch", icon: Telescope },
    { label: "Live Map", href: "/supervisor/map", icon: MapPin },
    { label: "Drivers", href: "/supervisor/drivers", icon: Users },
    { label: "Alerts", href: "/supervisor/alerts", icon: Bell, badge: 3 },
    {
      label: "Communications",
      icon: Bell,
      badgeKey: "messages",
      items: [
        { label: "Messaging Center", href: "/supervisor/messages", icon: Send },
        { label: "Omnichannel Inbox", href: "/supervisor/inbox", icon: Inbox },
      ] },
    { label: "Reports", href: "/supervisor/reports", icon: BarChart3 },
  ] };

// ─── Legacy role-based sidebars (non-multi-stakeholder fallback) ───

const dispatcherSidebar: SidebarConfig = {
  orgTypeLabel: "Dispatcher",
  homeRoute: "/dispatcher",
  entries: [
    { label: "Operations Center", href: "/dispatcher", icon: LayoutDashboard },
    { label: "Dispatch", href: "/dispatcher/dispatch", icon: Telescope },
    { label: "Live Map", href: "/dispatcher/map", icon: MapPin },
    { label: "Drivers", href: "/dispatcher/drivers", icon: Users },
    { label: "Devices", href: "/dispatcher/devices", icon: Cpu },
    { label: "SIM Cards", href: "/dispatcher/sims", icon: Wifi },
    { label: "Alerts", href: "/dispatcher/alerts", icon: Bell, badge: 3 },
    {
      label: "Communications",
      icon: Bell,
      badgeKey: "messages",
      items: [
        { label: "Messaging Center", href: "/dispatcher/messages", icon: Send },
        { label: "Omnichannel Inbox", href: "/dispatcher/inbox", icon: Inbox },
      ] },
    { label: "Reports", href: "/dispatcher/reports", icon: BarChart3 },
  ] };

const operationsManagerSidebar: SidebarConfig = {
  orgTypeLabel: "Operations Manager",
  homeRoute: "/admin",
  entries: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Fleet", href: "/admin/fleet", icon: Truck },
    { label: "Live Map", href: "/admin/map", icon: MapPin },
    { label: "Drivers", href: "/admin/drivers", icon: Users },
    { label: "Devices", href: "/admin/devices", icon: Cpu },
    { label: "Installation", href: "/admin/installation", icon: Wrench },
    { label: "IoT SIMs Request", href: "/admin/sims", icon: Wifi },
    { label: "Jobs", href: "/admin/jobs", icon: Package },
    { label: "Compliance", href: "/admin/compliance", icon: Shield },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    {
      label: "Communications",
      icon: Bell,
      badgeKey: "messages",
      items: [
        { label: "Messaging Center", href: "/admin/messages", icon: Send },
        { label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox },
      ] },
  ] };

const installerSidebar: SidebarConfig = {
  orgTypeLabel: "Installer",
  homeRoute: "/admin/installation",
  entries: [
    { label: "Installation", href: "/admin/installation", icon: Wrench },
    { label: "Devices", href: "/admin/devices", icon: Cpu },
  ] };

const viewerFinanceSidebar: SidebarConfig = {
  orgTypeLabel: "Finance",
  homeRoute: "/admin/analytics",
  entries: [
    { label: "Dashboard", href: "/admin/analytics", icon: LayoutDashboard },
    { label: "Fleet", href: "/admin/fleet", icon: Truck },
    { label: "Devices", href: "/admin/devices", icon: Cpu },
    { label: "SIM Cards", href: "/admin/sims", icon: Wifi },
    { label: "Fuel Costs", href: "/admin/fuel", icon: Gauge },
    { label: "Maintenance", href: "/admin/fleet?tab=maintenance", icon: Settings },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Wallet & Billing", href: "/admin/wallet", icon: CreditCard },
  ] };

/**
 * Centralized sidebar resolver.
 * Returns the sidebar config based on the active org membership + user role.
 * When multi-stakeholder is enabled, sidebar items are filtered by the user's
 * role within the active org (ADMIN sees all, DISPATCHER/FINANCE/VIEWER see less).
 */
export function getSidebarConfig(
  user: AppUser | null,
  activeOrg: OrgMembership | null,
  multiStakeholderEnabled: boolean
): SidebarConfig {
  // Platform admin always gets the platform sidebar, regardless of org memberships
  if (user?.role === 'platform_admin') {
    return platformAdminSidebar;
  }

  // Org-type–driven configs when multi-stakeholder is active
  if (multiStakeholderEnabled && activeOrg) {
    const roleKeys = activeOrg.roleKeys.length > 0 ? activeOrg.roleKeys : ['VIEWER'];

    switch (activeOrg.orgType) {
      case "ENTERPRISE":
        return {
          orgTypeLabel: "Enterprise",
          homeRoute: "/enterprise",
          entries: filterEntriesByRole(enterpriseEntries, roleKeys) };
      case "AGGREGATOR":
        return {
          orgTypeLabel: "Aggregator",
          homeRoute: "/aggregator",
          entries: filterEntriesByRole(aggregatorEntries, roleKeys) };
      case "OWNER_OPERATOR":
        return {
          orgTypeLabel: "Owner-Operator",
          homeRoute: "/owner-operator",
          entries: filterEntriesByRole(ownerOperatorEntries, roleKeys) };
      case "FLEET_PROVIDER":
        return {
          orgTypeLabel: "Fleet Provider",
          homeRoute: "/admin",
          entries: filterEntriesByRole(fleetProviderEntries, roleKeys) };
    }
  }

  // Legacy tenant-role fallback
  switch (user?.role) {
    case "tenant_admin":
      return {
        orgTypeLabel: "Fleet Provider",
        homeRoute: "/admin",
        entries: fleetProviderEntries };
    case "operations_manager":
      return operationsManagerSidebar;
    case "supervisor":
      return supervisorSidebar;
    case "dispatcher":
      return dispatcherSidebar;
    case "viewer_finance":
      return viewerFinanceSidebar;
    case "installer":
      return installerSidebar;
    default:
      return {
        orgTypeLabel: "Fleet Provider",
        homeRoute: "/admin",
        entries: fleetProviderEntries };
  }
}

/**
 * Get all allowed hrefs for a sidebar config (used for redirect-on-switch).
 */
export function getAllowedRoutes(config: SidebarConfig): string[] {
  const routes: string[] = [config.homeRoute];
  for (const entry of config.entries) {
    if (isNavGroup(entry)) {
      routes.push(...entry.items.map((i) => i.href));
    } else {
      routes.push(entry.href);
    }
  }
  return routes;
}
