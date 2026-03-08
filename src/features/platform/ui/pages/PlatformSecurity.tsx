import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  LogIn,
  LogOut,
  UserX,
  Key,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  Building2,
  User,
  Activity,
  Ban,
  FileWarning,
  Plus,
  Loader2,
  Trash2,
  Settings2,
  Zap,
  Flag,
  Mail,
  Bell,
  Send,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatDateInTimezone, type Timezone, TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/timezone";
import { useIPBlocking, useSecurityAuditLogs, type BlockedIP } from "@/hooks/useIPBlocking";
import { useAutoIPBlocking, type IPGeolocation, type AutoBlockingRule } from "@/hooks/useAutoIPBlocking";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { GeographicHeatmap } from "@/components/security/GeographicHeatmap";
import { toast } from "sonner";

interface LoginEvent {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  tenant: string;
  tenantId: string;
  eventType: "login" | "logout" | "session_refresh";
  status: "success" | "failed";
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  timestamp: string;
  sessionDuration?: string;
}

interface FailedAttempt {
  id: string;
  email: string;
  ipAddress: string;
  location: string;
  reason: "invalid_password" | "user_not_found" | "account_locked" | "mfa_failed" | "suspicious_activity";
  attempts: number;
  timestamp: string;
  blocked: boolean;
}

interface SecurityEvent {
  id: string;
  eventType: "password_change" | "mfa_enabled" | "mfa_disabled" | "api_key_created" | "api_key_revoked" | "permission_change" | "account_locked" | "account_unlocked" | "suspicious_login" | "data_export";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  userEmail?: string;
  userName?: string;
  tenant: string;
  tenantId: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

const loginTrendData = [
  { hour: "00:00", logins: 12, failed: 2 },
  { hour: "02:00", logins: 5, failed: 1 },
  { hour: "04:00", logins: 3, failed: 0 },
  { hour: "06:00", logins: 18, failed: 3 },
  { hour: "08:00", logins: 145, failed: 8 },
  { hour: "10:00", logins: 189, failed: 12 },
  { hour: "12:00", logins: 167, failed: 6 },
  { hour: "14:00", logins: 198, failed: 9 },
  { hour: "16:00", logins: 176, failed: 7 },
  { hour: "18:00", logins: 89, failed: 4 },
  { hour: "20:00", logins: 45, failed: 2 },
  { hour: "22:00", logins: 23, failed: 1 },
];

const eventsByTenant = [
  { tenant: "ABC Logistics", logins: 342, failed: 18, events: 12 },
  { tenant: "XYZ Transport", logins: 256, failed: 8, events: 5 },
  { tenant: "Quick Movers", logins: 189, failed: 23, events: 8 },
  { tenant: "Metro Couriers", logins: 145, failed: 5, events: 3 },
  { tenant: "Swift Delivery", logins: 198, failed: 11, events: 7 },
];

const mockLoginEvents: LoginEvent[] = [
  {
    id: "le-001",
    userId: "user-1",
    userEmail: "admin@abclogistics.com",
    userName: "John Admin",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    eventType: "login",
    status: "success",
    ipAddress: "102.89.45.123",
    location: "Lagos, Nigeria",
    device: "Desktop",
    browser: "Chrome 120",
    timestamp: "2024-12-11T14:32:00Z",
  },
  {
    id: "le-002",
    userId: "user-2",
    userEmail: "ops@xyztransport.com",
    userName: "Sarah Ops",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    eventType: "login",
    status: "success",
    ipAddress: "105.112.78.90",
    location: "Abuja, Nigeria",
    device: "Mobile",
    browser: "Safari iOS",
    timestamp: "2024-12-11T14:28:00Z",
  },
  {
    id: "le-003",
    userId: "user-3",
    userEmail: "driver@quickmovers.com",
    userName: "Mike Driver",
    tenant: "Quick Movers",
    tenantId: "tenant-3",
    eventType: "logout",
    status: "success",
    ipAddress: "197.210.45.67",
    location: "Port Harcourt, Nigeria",
    device: "Mobile",
    browser: "Chrome Android",
    timestamp: "2024-12-11T14:15:00Z",
    sessionDuration: "4h 23m",
  },
  {
    id: "le-004",
    userId: "user-4",
    userEmail: "fleet@metrocouriers.com",
    userName: "James Fleet",
    tenant: "Metro Couriers",
    tenantId: "tenant-4",
    eventType: "login",
    status: "failed",
    ipAddress: "41.58.123.45",
    location: "Kano, Nigeria",
    device: "Desktop",
    browser: "Firefox 121",
    timestamp: "2024-12-11T14:10:00Z",
  },
  {
    id: "le-005",
    userId: "user-5",
    userEmail: "super@swiftdelivery.com",
    userName: "Linda Super",
    tenant: "Swift Delivery",
    tenantId: "tenant-5",
    eventType: "session_refresh",
    status: "success",
    ipAddress: "102.67.89.234",
    location: "Ibadan, Nigeria",
    device: "Desktop",
    browser: "Edge 120",
    timestamp: "2024-12-11T14:05:00Z",
  },
];

const mockFailedAttempts: FailedAttempt[] = [
  {
    id: "fa-001",
    email: "admin@abclogistics.com",
    ipAddress: "185.234.67.89",
    location: "Unknown (VPN)",
    reason: "invalid_password",
    attempts: 5,
    timestamp: "2024-12-11T14:45:00Z",
    blocked: false,
  },
  {
    id: "fa-002",
    email: "nonexistent@company.com",
    ipAddress: "91.234.56.78",
    location: "Moscow, Russia",
    reason: "user_not_found",
    attempts: 12,
    timestamp: "2024-12-11T14:30:00Z",
    blocked: true,
  },
  {
    id: "fa-003",
    email: "locked@xyztransport.com",
    ipAddress: "102.89.45.123",
    location: "Lagos, Nigeria",
    reason: "account_locked",
    attempts: 3,
    timestamp: "2024-12-11T14:20:00Z",
    blocked: false,
  },
  {
    id: "fa-004",
    email: "driver@quickmovers.com",
    ipAddress: "197.210.45.67",
    location: "Port Harcourt, Nigeria",
    reason: "mfa_failed",
    attempts: 2,
    timestamp: "2024-12-11T14:10:00Z",
    blocked: false,
  },
  {
    id: "fa-005",
    email: "test@test.com",
    ipAddress: "45.67.89.123",
    location: "Beijing, China",
    reason: "suspicious_activity",
    attempts: 50,
    timestamp: "2024-12-11T13:55:00Z",
    blocked: true,
  },
];

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: "se-001",
    eventType: "suspicious_login",
    severity: "critical",
    userId: "user-1",
    userEmail: "admin@abclogistics.com",
    userName: "John Admin",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    description: "Login from unusual location detected (Moscow, Russia) for admin account",
    ipAddress: "91.234.56.78",
    timestamp: "2024-12-11T14:50:00Z",
    metadata: { previousLocation: "Lagos, Nigeria", newLocation: "Moscow, Russia" },
  },
  {
    id: "se-002",
    eventType: "mfa_enabled",
    severity: "low",
    userId: "user-2",
    userEmail: "ops@xyztransport.com",
    userName: "Sarah Ops",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    description: "Two-factor authentication enabled for account",
    ipAddress: "105.112.78.90",
    timestamp: "2024-12-11T14:35:00Z",
  },
  {
    id: "se-003",
    eventType: "account_locked",
    severity: "high",
    userId: "user-6",
    userEmail: "locked@xyztransport.com",
    userName: "Tom Locked",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    description: "Account locked after 5 failed login attempts",
    ipAddress: "102.89.45.123",
    timestamp: "2024-12-11T14:20:00Z",
  },
  {
    id: "se-004",
    eventType: "api_key_created",
    severity: "medium",
    userId: "user-3",
    userEmail: "dev@quickmovers.com",
    userName: "Alex Dev",
    tenant: "Quick Movers",
    tenantId: "tenant-3",
    description: "New API key created with full read/write permissions",
    ipAddress: "197.210.45.67",
    timestamp: "2024-12-11T14:00:00Z",
    metadata: { keyName: "Production API Key", permissions: "read,write" },
  },
  {
    id: "se-005",
    eventType: "permission_change",
    severity: "medium",
    userId: "user-4",
    userEmail: "fleet@metrocouriers.com",
    userName: "James Fleet",
    tenant: "Metro Couriers",
    tenantId: "tenant-4",
    description: "User role elevated from 'viewer' to 'admin'",
    ipAddress: "41.58.123.45",
    timestamp: "2024-12-11T13:45:00Z",
    metadata: { previousRole: "viewer", newRole: "admin", changedBy: "super@metrocouriers.com" },
  },
  {
    id: "se-006",
    eventType: "data_export",
    severity: "medium",
    userId: "user-5",
    userEmail: "super@swiftdelivery.com",
    userName: "Linda Super",
    tenant: "Swift Delivery",
    tenantId: "tenant-5",
    description: "Large data export performed (15,000 records)",
    ipAddress: "102.67.89.234",
    timestamp: "2024-12-11T13:30:00Z",
    metadata: { recordCount: "15000", dataType: "customer_data" },
  },
  {
    id: "se-007",
    eventType: "password_change",
    severity: "low",
    userId: "user-1",
    userEmail: "admin@abclogistics.com",
    userName: "John Admin",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    description: "Password changed successfully",
    ipAddress: "102.89.45.123",
    timestamp: "2024-12-11T12:00:00Z",
  },
];

export default function PlatformSecurity() {
  const [loginEvents] = useState<LoginEvent[]>(mockLoginEvents);
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>(mockFailedAttempts);
  const [securityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
  const [timezone, setTimezone] = useState<Timezone>(DEFAULT_TIMEZONE);
  
  // IP Blocking state
  const { blockedIPs: dbBlockedIPs, isLoading: isLoadingIPs, fetchBlockedIPs, blockIP, unblockIP } = useIPBlocking();
  const { logs: auditLogs, isLoading: isLoadingLogs, fetchLogs } = useSecurityAuditLogs();
  const { 
    rules: autoBlockingRules, 
    toggleRule, 
    updateRule, 
    getIPGeolocation, 
    batchGetGeolocation,
    geoCache 
  } = useAutoIPBlocking();
  
  const { config: alertConfig, updateConfig: updateAlertConfig, sendTestAlert, isSending: isSendingAlert } = useSecurityAlerts();
  
  const [isBlockIPDialogOpen, setIsBlockIPDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [selectedIPToUnblock, setSelectedIPToUnblock] = useState<BlockedIP | null>(null);
  const [newBlockIP, setNewBlockIP] = useState({ ip_address: "", reason: "", is_permanent: false });
  const [isBlocking, setIsBlocking] = useState(false);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const [ipGeoData, setIpGeoData] = useState<Map<string, IPGeolocation>>(new Map());
  const [loadingGeoIPs, setLoadingGeoIPs] = useState<Set<string>>(new Set());

  // Fetch geolocation for failed attempts
  useEffect(() => {
    const fetchGeolocations = async () => {
      const ipsToFetch = failedAttempts
        .filter(fa => !ipGeoData.has(fa.ipAddress) && !loadingGeoIPs.has(fa.ipAddress))
        .map(fa => fa.ipAddress)
        .slice(0, 5); // Limit batch size

      if (ipsToFetch.length === 0) return;

      setLoadingGeoIPs(prev => new Set([...prev, ...ipsToFetch]));
      
      const results = await batchGetGeolocation(ipsToFetch);
      
      setIpGeoData(prev => {
        const newMap = new Map(prev);
        results.forEach((geo, ip) => newMap.set(ip, geo));
        return newMap;
      });
      
      setLoadingGeoIPs(prev => {
        const newSet = new Set(prev);
        ipsToFetch.forEach(ip => newSet.delete(ip));
        return newSet;
      });
    };

    fetchGeolocations();
  }, [failedAttempts, batchGetGeolocation, ipGeoData, loadingGeoIPs]);

  const totalLogins = loginEvents.filter(e => e.eventType === "login" && e.status === "success").length;
  const totalFailedAttempts = failedAttempts.reduce((sum, fa) => sum + fa.attempts, 0);
  const blockedIPsCount = dbBlockedIPs.length;
  const criticalEvents = securityEvents.filter(e => e.severity === "critical" || e.severity === "high").length;

  const filteredLoginEvents = loginEvents.filter((event) => {
    const matchesSearch =
      event.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = tenantFilter === "all" || event.tenantId === tenantFilter;
    return matchesSearch && matchesTenant;
  });

  const filteredSecurityEvents = securityEvents.filter((event) => {
    const matchesSearch =
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = tenantFilter === "all" || event.tenantId === tenantFilter;
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    return matchesSearch && matchesTenant && matchesSeverity;
  });

  const handleBlockIP = async () => {
    if (!newBlockIP.ip_address || !newBlockIP.reason) {
      toast.error("Please enter IP address and reason");
      return;
    }
    
    setIsBlocking(true);
    const success = await blockIP(newBlockIP.ip_address, newBlockIP.reason, {
      isPermanent: newBlockIP.is_permanent
    });
    
    if (success) {
      setIsBlockIPDialogOpen(false);
      setNewBlockIP({ ip_address: "", reason: "", is_permanent: false });
      // Update failed attempts to show blocked status
      setFailedAttempts(prev => prev.map(fa => 
        fa.ipAddress === newBlockIP.ip_address ? { ...fa, blocked: true } : fa
      ));
    }
    setIsBlocking(false);
  };

  const handleUnblockIP = async () => {
    if (!selectedIPToUnblock) return;
    
    const success = await unblockIP(selectedIPToUnblock.ip_address);
    if (success) {
      setIsUnblockDialogOpen(false);
      setSelectedIPToUnblock(null);
      // Update failed attempts to show unblocked status
      setFailedAttempts(prev => prev.map(fa => 
        fa.ipAddress === selectedIPToUnblock.ip_address ? { ...fa, blocked: false } : fa
      ));
    }
  };

  const handleBlockIPFromAttempt = (ipAddress: string, reason: string) => {
    setNewBlockIP({ ip_address: ipAddress, reason, is_permanent: false });
    setIsBlockIPDialogOpen(true);
  };

  const getEventTypeBadge = (type: LoginEvent["eventType"]) => {
    switch (type) {
      case "login":
        return <Badge className="bg-success/10 text-success border-success/30"><LogIn className="h-3 w-3 mr-1" />Login</Badge>;
      case "logout":
        return <Badge className="bg-muted text-muted-foreground"><LogOut className="h-3 w-3 mr-1" />Logout</Badge>;
      case "session_refresh":
        return <Badge className="bg-primary/10 text-primary border-primary/30"><RefreshCw className="h-3 w-3 mr-1" />Refresh</Badge>;
    }
  };

  const getStatusBadge = (status: "success" | "failed") => {
    return status === "success" ? (
      <Badge className="bg-success/10 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
    ) : (
      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
    );
  };

  const getFailureReasonBadge = (reason: FailedAttempt["reason"]) => {
    switch (reason) {
      case "invalid_password":
        return <Badge variant="destructive"><Key className="h-3 w-3 mr-1" />Invalid Password</Badge>;
      case "user_not_found":
        return <Badge className="bg-warning/10 text-warning border-warning/30"><UserX className="h-3 w-3 mr-1" />User Not Found</Badge>;
      case "account_locked":
        return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Account Locked</Badge>;
      case "mfa_failed":
        return <Badge className="bg-primary/10 text-primary border-primary/30"><Shield className="h-3 w-3 mr-1" />MFA Failed</Badge>;
      case "suspicious_activity":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Suspicious</Badge>;
    }
  };

  const getSeverityBadge = (severity: SecurityEvent["severity"] | 'info' | 'warning') => {
    switch (severity) {
      case "low":
      case "info":
        return <Badge className="bg-muted text-muted-foreground">{severity === 'info' ? 'Info' : 'Low'}</Badge>;
      case "medium":
      case "warning":
        return <Badge className="bg-warning/10 text-warning border-warning/30">{severity === 'warning' ? 'Warning' : 'Medium'}</Badge>;
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "critical":
        return <Badge className="bg-destructive text-destructive-foreground animate-pulse">Critical</Badge>;
    }
  };

  const getSecurityEventIcon = (type: SecurityEvent["eventType"] | string) => {
    switch (type) {
      case "password_change":
        return <Key className="h-4 w-4" />;
      case "mfa_enabled":
        return <ShieldCheck className="h-4 w-4" />;
      case "mfa_disabled":
        return <ShieldX className="h-4 w-4" />;
      case "api_key_created":
        return <Key className="h-4 w-4" />;
      case "api_key_revoked":
        return <Ban className="h-4 w-4" />;
      case "permission_change":
        return <Shield className="h-4 w-4" />;
      case "account_locked":
        return <Lock className="h-4 w-4" />;
      case "account_unlocked":
        return <Unlock className="h-4 w-4" />;
      case "suspicious_login":
        return <ShieldAlert className="h-4 w-4" />;
      case "data_export":
        return <FileWarning className="h-4 w-4" />;
      case "ip_blocked":
        return <Ban className="h-4 w-4" />;
      case "ip_unblocked":
        return <Unlock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    return device === "Mobile" ? (
      <Smartphone className="h-4 w-4 text-muted-foreground" />
    ) : (
      <Monitor className="h-4 w-4 text-muted-foreground" />
    );
  };

  const getThreatLevelBadge = (threatLevel: 'low' | 'medium' | 'high' | 'critical') => {
    switch (threatLevel) {
      case 'low':
        return <Badge variant="outline" className="text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning border-warning/30 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Medium Risk</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs"><ShieldAlert className="h-3 w-3 mr-1" />High Risk</Badge>;
      case 'critical':
        return <Badge className="bg-destructive text-destructive-foreground animate-pulse text-xs"><ShieldX className="h-3 w-3 mr-1" />Critical</Badge>;
    }
  };

  const getCountryFlag = (countryCode: string) => {
    // Convert country code to flag emoji
    if (countryCode === 'XX' || !countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleViewEvent = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setIsEventSheetOpen(true);
  };

  return (
    <DashboardLayout
      title="Security Audit"
      subtitle="Monitor login activity, failed attempts, and security events"
    >
      {/* Timezone Selector */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={timezone} onValueChange={(value) => setTimezone(value as Timezone)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Timezone" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIMEZONES).map(([code, tz]) => (
                <SelectItem key={code} value={code}>
                  {tz.name} ({tz.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logins">Login History</TabsTrigger>
          <TabsTrigger value="failed">Failed Attempts</TabsTrigger>
          <TabsTrigger value="heatmap">Geographic Map</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="rules">Auto-Block Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sim-audit">SIM Audit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Successful Logins (24h)"
              value={totalLogins}
              icon={LogIn}
              change={12}
              changeLabel="vs yesterday"
              variant="success"
            />
            <StatCard
              title="Failed Attempts (24h)"
              value={totalFailedAttempts}
              icon={UserX}
              change={-8}
              changeLabel="vs yesterday"
              variant="warning"
            />
            <StatCard
              title="Blocked IPs"
              value={blockedIPsCount}
              icon={Ban}
              variant="default"
            />
            <StatCard
              title="Critical Events"
              value={criticalEvents}
              icon={ShieldAlert}
              variant="danger"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Login Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Login Activity (24h)
                </CardTitle>
                <CardDescription>Successful logins vs failed attempts by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={loginTrendData}>
                    <defs>
                      <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="logins"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLogins)"
                      name="Successful Logins"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                      name="Failed Attempts"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events by Tenant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Activity by Tenant
                </CardTitle>
                <CardDescription>Login and event distribution across tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventsByTenant} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="tenant" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="logins" fill="hsl(var(--primary))" name="Logins" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Recent Security Events
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewEvent(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        event.severity === "critical" ? "bg-destructive/10 text-destructive" :
                        event.severity === "high" ? "bg-destructive/10 text-destructive" :
                        event.severity === "medium" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {getSecurityEventIcon(event.eventType)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {event.tenant}
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          {formatDateInTimezone(event.timestamp, timezone, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {getSeverityBadge(event.severity)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="logins" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-primary" />
                  Login History
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, email, or tenant..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="tenant-1">ABC Logistics</SelectItem>
                    <SelectItem value="tenant-2">XYZ Transport</SelectItem>
                    <SelectItem value="tenant-3">Quick Movers</SelectItem>
                    <SelectItem value="tenant-4">Metro Couriers</SelectItem>
                    <SelectItem value="tenant-5">Swift Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Time ({TIMEZONES[timezone].offset})</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoginEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {event.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{event.userName}</p>
                              <p className="text-xs text-muted-foreground">{event.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {event.tenant}
                          </div>
                        </TableCell>
                        <TableCell>{getEventTypeBadge(event.eventType)}</TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {event.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {getDeviceIcon(event.device)}
                            <span>{event.browser}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatDateInTimezone(event.timestamp, timezone, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="h-4 w-4 mr-2" />
                                View User Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="h-4 w-4 mr-2" />
                                Block IP
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Attempts Tab */}
        <TabsContent value="failed" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-destructive" />
                  Failed Login Attempts
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Origin / Threat</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time ({TIMEZONES[timezone].offset})</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedAttempts.map((attempt) => {
                      const geoData = ipGeoData.get(attempt.ipAddress);
                      const isLoadingGeo = loadingGeoIPs.has(attempt.ipAddress);
                      
                      return (
                        <TableRow key={attempt.id} className={geoData?.threat.threatLevel === 'high' || geoData?.threat.threatLevel === 'critical' ? 'bg-destructive/5' : ''}>
                          <TableCell>
                            <p className="font-medium text-sm">{attempt.email}</p>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{attempt.ipAddress}</code>
                          </TableCell>
                          <TableCell>
                            {isLoadingGeo ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            ) : geoData ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-lg">{getCountryFlag(geoData.countryCode)}</span>
                                  <span>{geoData.city}, {geoData.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getThreatLevelBadge(geoData.threat.threatLevel)}
                                  {geoData.threat.isProxy && (
                                    <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Proxy/VPN</Badge>
                                  )}
                                  {geoData.threat.isDatacenter && (
                                    <Badge variant="outline" className="text-xs"><Monitor className="h-3 w-3 mr-1" />Datacenter</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{geoData.isp}</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {attempt.location}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getFailureReasonBadge(attempt.reason)}</TableCell>
                          <TableCell>
                            <Badge variant={attempt.attempts >= 10 ? "destructive" : attempt.attempts >= 5 ? "secondary" : "outline"}>
                              {attempt.attempts}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {attempt.blocked ? (
                              <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Blocked</Badge>
                            ) : (
                              <Badge variant="outline">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDateInTimezone(attempt.timestamp, timezone, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!attempt.blocked ? (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleBlockIPFromAttempt(attempt.ipAddress, `Suspicious activity from ${geoData?.city || attempt.location}`)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Block IP
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Unblock IP
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-6">
          <GeographicHeatmap 
            attempts={failedAttempts.map(fa => {
              const geo = ipGeoData.get(fa.ipAddress);
              return {
                ip: fa.ipAddress,
                country: geo?.country || 'Unknown',
                countryCode: geo?.countryCode || 'XX',
                city: geo?.city || 'Unknown',
                count: fa.attempts,
                threatLevel: (geo?.threat?.threatLevel as 'low' | 'medium' | 'high') || 'medium',
                lastAttempt: new Date(fa.timestamp)
              };
            })}
          />
        </TabsContent>

        {/* Auto-Block Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Automated IP Blocking Rules
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Configure automatic IP blocking based on failed login attempts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {autoBlockingRules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`p-4 rounded-lg border ${rule.enabled ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <h4 className="font-medium">{rule.name}</h4>
                          {rule.enabled && (
                            <Badge className="bg-success/10 text-success border-success/30">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Attempts</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={rule.maxAttempts}
                                onChange={(e) => updateRule(rule.id, { maxAttempts: parseInt(e.target.value) || 5 })}
                                className="w-20 h-8"
                              />
                              <span className="text-sm text-muted-foreground">attempts</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Time Window</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={1440}
                                value={rule.timeWindowMinutes}
                                onChange={(e) => updateRule(rule.id, { timeWindowMinutes: parseInt(e.target.value) || 15 })}
                                className="w-20 h-8"
                              />
                              <span className="text-sm text-muted-foreground">minutes</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Block Duration</Label>
                            <div className="flex items-center gap-2">
                              {rule.blockDurationHours === null ? (
                                <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Permanent</Badge>
                              ) : (
                                <>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={8760}
                                    value={rule.blockDurationHours}
                                    onChange={(e) => updateRule(rule.id, { blockDurationHours: parseInt(e.target.value) || 24 })}
                                    className="w-20 h-8"
                                  />
                                  <span className="text-sm text-muted-foreground">hours</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex items-start gap-4 p-4 rounded-lg border border-dashed">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">How Auto-Blocking Works</h4>
                  <p className="text-sm text-muted-foreground">
                    When an IP address exceeds the configured number of failed login attempts within the specified time window, 
                    it will be automatically blocked. Multiple rules can be active simultaneously - the first matching rule will trigger the block.
                    All auto-blocked IPs are logged in the Security Events tab.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Configure email alerts for security events
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enable/Disable Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive email alerts for security events</p>
                    </div>
                  </div>
                  <Switch
                    checked={alertConfig.enabled}
                    onCheckedChange={(checked) => updateAlertConfig({ enabled: checked })}
                  />
                </div>

                {/* Recipient Email */}
                <div className="space-y-2">
                  <Label htmlFor="recipient_email">Recipient Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipient_email"
                      type="email"
                      placeholder="security@yourcompany.com"
                      value={alertConfig.recipientEmail}
                      onChange={(e) => updateAlertConfig({ recipientEmail: e.target.value })}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={sendTestAlert}
                      disabled={!alertConfig.recipientEmail || isSendingAlert}
                    >
                      {isSendingAlert ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This email will receive all security alert notifications
                  </p>
                </div>

                <Separator />

                {/* Alert Types */}
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Types</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Ban className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium text-sm">Auto-Blocked IPs</p>
                        <p className="text-xs text-muted-foreground">Get notified when an IP is automatically blocked</p>
                      </div>
                    </div>
                    <Switch
                      checked={alertConfig.alertOnAutoBlock}
                      onCheckedChange={(checked) => updateAlertConfig({ alertOnAutoBlock: checked })}
                      disabled={!alertConfig.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium text-sm">Critical Security Events</p>
                        <p className="text-xs text-muted-foreground">Get notified for critical and high severity events</p>
                      </div>
                    </div>
                    <Switch
                      checked={alertConfig.alertOnCriticalEvents}
                      onCheckedChange={(checked) => updateAlertConfig({ alertOnCriticalEvents: checked })}
                      disabled={!alertConfig.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Suspicious Activity</p>
                        <p className="text-xs text-muted-foreground">Get notified for suspicious login patterns</p>
                      </div>
                    </div>
                    <Switch
                      checked={alertConfig.alertOnSuspiciousActivity}
                      onCheckedChange={(checked) => updateAlertConfig({ alertOnSuspiciousActivity: checked })}
                      disabled={!alertConfig.enabled}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-4 p-4 rounded-lg border border-dashed bg-muted/20">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Email Notification Preview</h4>
                    <p className="text-sm text-muted-foreground">
                      When enabled, you'll receive beautifully formatted email alerts containing IP address, 
                      geographic location, threat level, and recommended actions. Click "Test" to preview an example email.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Security Events
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="tenant-1">ABC Logistics</SelectItem>
                    <SelectItem value="tenant-2">XYZ Transport</SelectItem>
                    <SelectItem value="tenant-3">Quick Movers</SelectItem>
                    <SelectItem value="tenant-4">Metro Couriers</SelectItem>
                    <SelectItem value="tenant-5">Swift Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time ({TIMEZONES[timezone].offset})</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecurityEvents.map((event) => (
                      <TableRow key={event.id} className={event.severity === "critical" ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                              event.severity === "critical" ? "bg-destructive/10 text-destructive" :
                              event.severity === "high" ? "bg-destructive/10 text-destructive" :
                              event.severity === "medium" ? "bg-warning/10 text-warning" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {getSecurityEventIcon(event.eventType)}
                            </div>
                            <p className="font-medium text-sm max-w-[300px] truncate">{event.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                        <TableCell>
                          {event.userEmail ? (
                            <div>
                              <p className="font-medium text-sm">{event.userName}</p>
                              <p className="text-xs text-muted-foreground">{event.userEmail}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {event.tenant}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{event.ipAddress}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatDateInTimezone(event.timestamp, timezone, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewEvent(event)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SIM Audit Tab */}
        <TabsContent value="sim-audit" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  SIM Activation Audit Trail
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              <CardDescription>
                Complete audit trail for SIM requests, approvals, and activations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Time ({TIMEZONES[timezone].offset})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs
                        .filter(log => 
                          log.event_type.includes('sim_') || 
                          log.event_type === 'kyb_requested'
                        )
                        .map((log) => (
                          <TableRow key={log.id} className={log.severity === 'high' ? 'bg-warning/5' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  log.event_type === 'sim_activated' ? 'bg-success/10 text-success' :
                                  log.event_type === 'sim_request_approved' ? 'bg-primary/10 text-primary' :
                                  log.event_type === 'sim_request_rejected' ? 'bg-destructive/10 text-destructive' :
                                  log.event_type === 'sim_activation_triggered' ? 'bg-warning/10 text-warning' :
                                  log.event_type === 'kyb_requested' ? 'bg-secondary text-secondary-foreground' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {getSecurityEventIcon(log.event_type)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm capitalize">
                                    {log.event_type.replace(/_/g, ' ')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                            <TableCell>
                              {log.user_name ? (
                                <div>
                                  <p className="font-medium text-sm">{log.user_name}</p>
                                  {log.user_email && <p className="text-xs text-muted-foreground">{log.user_email}</p>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">System</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{log.tenant_name || log.tenant_id?.slice(0, 8) || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-[300px] truncate text-muted-foreground">
                                {log.description}
                              </p>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {log.metadata.quantity && (
                                    <Badge variant="outline" className="text-xs">
                                      {String(log.metadata.quantity)} SIM(s)
                                    </Badge>
                                  )}
                                  {log.metadata.operator && (
                                    <Badge variant="outline" className="text-xs">
                                      {String(log.metadata.operator)}
                                    </Badge>
                                  )}
                                  {log.metadata.activated !== undefined && (
                                    <Badge className="bg-success/10 text-success text-xs">
                                      {String(log.metadata.activated)} activated
                                    </Badge>
                                  )}
                                  {log.metadata.failed !== undefined && Number(log.metadata.failed) > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {String(log.metadata.failed)} failed
                                    </Badge>
                                  )}
                                  {log.metadata.override_applied && (
                                    <Badge className="bg-warning/10 text-warning text-xs">
                                      Override
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatDateInTimezone(log.created_at, timezone, { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {auditLogs.filter(log => 
                        log.event_type.includes('sim_') || 
                        log.event_type === 'kyb_requested'
                      ).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No SIM audit events found</p>
                            <p className="text-sm">Events will appear here when SIM requests are processed</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-destructive" />
                  Blocked IP Addresses
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchBlockedIPs()} disabled={isLoadingIPs}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingIPs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => setIsBlockIPDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Block IP
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingIPs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : dbBlockedIPs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">No Blocked IPs</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No IP addresses are currently blocked. You can block suspicious IPs from the Failed Attempts tab or add them manually.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Blocked At ({TIMEZONES[timezone].offset})</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbBlockedIPs.map((blocked) => (
                        <TableRow key={blocked.id}>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{blocked.ip_address}</code>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-[250px] truncate">{blocked.reason}</p>
                          </TableCell>
                          <TableCell>
                            {blocked.is_permanent ? (
                              <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Permanent</Badge>
                            ) : (
                              <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Temporary</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDateInTimezone(blocked.blocked_at, timezone, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {blocked.expires_at ? (
                              <span className="text-sm">{formatDateInTimezone(blocked.expires_at, timezone, { month: 'short', day: 'numeric' })}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedIPToUnblock(blocked);
                                setIsUnblockDialogOpen(true);
                              }}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Event Details Sheet */}
      <Sheet open={isEventSheetOpen} onOpenChange={setIsEventSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                selectedEvent?.severity === "critical" ? "bg-destructive/10 text-destructive" :
                selectedEvent?.severity === "high" ? "bg-destructive/10 text-destructive" :
                selectedEvent?.severity === "medium" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                {selectedEvent && getSecurityEventIcon(selectedEvent.eventType)}
              </div>
              Security Event
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {selectedEvent && getSeverityBadge(selectedEvent.severity)}
              <span>{selectedEvent?.eventType.replace("_", " ").toUpperCase()}</span>
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <ScrollArea className="h-[calc(100vh-180px)] mt-6">
              <div className="space-y-6 pr-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Event Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Event Type</span>
                      <span className="capitalize">{selectedEvent.eventType.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Severity</span>
                      {getSeverityBadge(selectedEvent.severity)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timestamp</span>
                      <span>{formatDateInTimezone(selectedEvent.timestamp, timezone)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address</span>
                      <code className="bg-muted px-2 py-1 rounded">{selectedEvent.ipAddress}</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">User Information</h4>
                  {selectedEvent.userEmail ? (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {selectedEvent.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{selectedEvent.userName}</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.userEmail}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">System-generated event</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Tenant</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {selectedEvent.tenant.charAt(0)}
                    </div>
                    <p className="font-medium">{selectedEvent.tenant}</p>
                  </div>
                </div>

                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Additional Details</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedEvent.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">{key.replace("_", " ")}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Event
                  </Button>
                  {selectedEvent.userId && (
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      View User
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Block IP Dialog */}
      <Dialog open={isBlockIPDialogOpen} onOpenChange={setIsBlockIPDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Block an IP address from accessing the platform. This will prevent all login attempts from this IP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={newBlockIP.ip_address}
                onChange={(e) => setNewBlockIP({ ...newBlockIP, ip_address: e.target.value })}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={newBlockIP.reason}
                onChange={(e) => setNewBlockIP({ ...newBlockIP, reason: e.target.value })}
                placeholder="e.g., Suspicious activity, multiple failed attempts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="permanent">Permanent Block</Label>
                <p className="text-xs text-muted-foreground">Block this IP indefinitely</p>
              </div>
              <Switch
                id="permanent"
                checked={newBlockIP.is_permanent}
                onCheckedChange={(checked) => setNewBlockIP({ ...newBlockIP, is_permanent: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockIPDialogOpen(false)} disabled={isBlocking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockIP} disabled={isBlocking}>
              {isBlocking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Block IP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock <code className="bg-muted px-2 py-1 rounded">{selectedIPToUnblock?.ip_address}</code>? 
              This will allow access from this IP address again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIPToUnblock(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockIP} className="bg-success hover:bg-success/90">
              <Unlock className="h-4 w-4 mr-2" />
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
