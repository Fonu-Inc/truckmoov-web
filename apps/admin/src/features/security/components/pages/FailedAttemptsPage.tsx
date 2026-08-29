import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Ban,
  Clock,
  Download,
  Eye,
  Globe,
  Key,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  MoreHorizontal,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Unlock,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { BlockedIP, FailedAttempt, IPGeolocation } from "@/features/security/types";
import { mockFailedAttempts } from "@/features/security/utils/mocks";

const FAILED_FILTER_FIELDS: FilterField[] = [
  {
    key: "tenant",
    label: "Tenant",
    type: "select",
    options: [
      {
        value: "tenant-1",
        label: "ABC Logistics",
      },
      {
        value: "tenant-2",
        label: "XYZ Transport",
      },
      {
        value: "tenant-3",
        label: "Quick Movers",
      },
    ],

  },
  {
    key: "reason",
    label: "Reason",
    type: "select",
    options: [
      {
        value: "invalid_password",
        label: "Invalid Password",
      },
      {
        value: "user_not_found",
        label: "User Not Found",
      },
      {
        value: "account_locked",
        label: "Account Locked",
      },
      {
        value: "mfa_failed",
        label: "MFA Failed",
      },
      {
        value: "suspicious_activity",
        label: "Suspicious Activity",
      },
    ],

  },
  {
    key: "time",
    label: "Time",
    type: "date",
  },
];

function getFailureReasonBadge(reason: FailedAttempt["reason"]) {
  switch (reason) {
    case "invalid_password":
      return (
        <Badge variant="destructive">
          <Key className="h-3 w-3 mr-1" />
          Invalid Password
        </Badge>
      );
    case "user_not_found":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <UserX className="h-3 w-3 mr-1" />
          User Not Found
        </Badge>
      );
    case "account_locked":
      return (
        <Badge variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Account Locked
        </Badge>
      );
    case "mfa_failed":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <Shield className="h-3 w-3 mr-1" />
          MFA Failed
        </Badge>
      );
    case "suspicious_activity":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Suspicious
        </Badge>
      );
  }
}

function getThreatLevelBadge(threatLevel: "low" | "medium" | "high" | "critical") {
  switch (threatLevel) {
    case "low":
      return (
        <Badge
          variant="outline"
          className="text-xs"
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Low Risk
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Medium Risk
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="destructive"
          className="text-xs"
        >
          <ShieldAlert className="h-3 w-3 mr-1" />
          High Risk
        </Badge>
      );
    case "critical":
      return (
        <Badge className="bg-destructive text-destructive-foreground animate-pulse text-xs">
          <ShieldX className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      );
  }
}

function getCountryFlag(countryCode: string) {
  // Convert country code to flag emoji
  if (countryCode === "XX" || !countryCode)
    return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function FailedAttemptsPage() {
  const [
    failedAttempts,
    setFailedAttempts,
  ] = useState<FailedAttempt[]>(mockFailedAttempts);
  const [
    selectedFailedAttempt,
    setSelectedFailedAttempt,
  ] = useState<FailedAttempt | null>(null);
  const { timezone } = usePreferences();
  const [
    failedStatusFilter,
    setFailedStatusFilter,
  ] = useState("all");
  const [
    failedSearchQuery,
    setFailedSearchQuery,
  ] = useState("");
  const [
    failedFilters,
    setFailedFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(FAILED_FILTER_FIELDS));

  // IP Blocking state (hooks removed — using inline defaults)
  const blockIP = async (_ip: string, _reason: string, _opts?: { isPermanent?: boolean }) => false;
  const unblockIP = async (_ip: string) => false;

  const [
    isBlockIPDialogOpen,
    setIsBlockIPDialogOpen,
  ] = useState(false);
  const [
    isUnblockDialogOpen,
    setIsUnblockDialogOpen,
  ] = useState(false);
  const [
    selectedIPToUnblock,
    setSelectedIPToUnblock,
  ] = useState<BlockedIP | null>(null);
  const [
    newBlockIP,
    setNewBlockIP,
  ] = useState({
    ip_address: "",
    reason: "",
    is_permanent: false,
  });
  const [
    isBlocking,
    setIsBlocking,
  ] = useState(false);
  const ipGeoData = useMemo(
    () => new Map<string, IPGeolocation>(),
    [],
  );
  const loadingGeoIPs = useMemo(
    () => new Set<string>(),
    [],
  );

  const handleBlockIP = async () => {
    if (!newBlockIP.ip_address || !newBlockIP.reason) {
      toast.error("Please enter IP address and reason");
      return;
    }

    setIsBlocking(true);
    const success = await blockIP(
      newBlockIP.ip_address,
      newBlockIP.reason,
      { isPermanent: newBlockIP.is_permanent },
    );

    if (success) {
      setIsBlockIPDialogOpen(false);
      setNewBlockIP({
        ip_address: "",
        reason: "",
        is_permanent: false,
      });
      // Update failed attempts to show blocked status
      setFailedAttempts(prev => prev.map(fa =>
        fa.ipAddress === newBlockIP.ip_address
          ? {
              ...fa,
              blocked: true,
            }
          : fa));
    }
    setIsBlocking(false);
  };

  const handleUnblockIP = async () => {
    if (!selectedIPToUnblock)
      return;

    const success = await unblockIP(selectedIPToUnblock.ip_address);
    if (success) {
      setIsUnblockDialogOpen(false);
      setSelectedIPToUnblock(null);
      // Update failed attempts to show unblocked status
      setFailedAttempts(prev => prev.map(fa =>
        fa.ipAddress === selectedIPToUnblock.ip_address
          ? {
              ...fa,
              blocked: false,
            }
          : fa));
    }
  };

  const handleBlockIPFromAttempt = (ipAddress: string, reason: string) => {
    setNewBlockIP({
      ip_address: ipAddress,
      reason,
      is_permanent: false,
    });
    setIsBlockIPDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Failed Login Attempts
              </CardTitle>
              <CardDescription>Recent unsuccessful sign-in attempts with IP, geolocation and threat scoring</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or IP..."
                className="pl-10"
                value={failedSearchQuery}
                onChange={e => setFailedSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={failedStatusFilter}
              onValueChange={setFailedStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="failed attempts"
              fields={FAILED_FILTER_FIELDS}
              value={failedFilters}
              onApply={setFailedFilters}
              onReset={() => setFailedFilters(buildEmptyDraft(FAILED_FILTER_FIELDS))}
            />
          </div>
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
                  <TableHead>
                    Time (
                    {TIMEZONES[timezone].offset}
                    )
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedAttempts.map((attempt) => {
                  const geoData = ipGeoData.get(attempt.ipAddress);
                  const isLoadingGeo = loadingGeoIPs.has(attempt.ipAddress);

                  return (
                    <TableRow
                      key={attempt.id}
                      className={geoData?.threat.threatLevel === "high" || geoData?.threat.threatLevel === "critical" ? "bg-destructive/5" : ""}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{attempt.email}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{attempt.ipAddress}</code>
                      </TableCell>
                      <TableCell>
                        {isLoadingGeo
                          ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            )
                          : geoData
                            ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">{getCountryFlag(geoData.countryCode)}</span>
                                    <span>
                                      {geoData.city}
                                      ,
                                      {" "}
                                      {geoData.country}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getThreatLevelBadge(geoData.threat.threatLevel)}
                                    {geoData.threat.isProxy && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        <Globe className="h-3 w-3 mr-1" />
                                        Proxy/VPN
                                      </Badge>
                                    )}
                                    {geoData.threat.isDatacenter && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        <Monitor className="h-3 w-3 mr-1" />
                                        Datacenter
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{geoData.isp}</p>
                                </div>
                              )
                            : (
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
                        {attempt.blocked
                          ? (
                              <Badge variant="destructive">
                                <Ban className="h-3 w-3 mr-1" />
                                Blocked
                              </Badge>
                            )
                          : (
                              <Badge variant="outline">Active</Badge>
                            )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDateInTimezone(
                            attempt.timestamp,
                            timezone,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedFailedAttempt(attempt)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!attempt.blocked
                              ? (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleBlockIPFromAttempt(
                                      attempt.ipAddress,
                                      `Suspicious activity from ${geoData?.city || attempt.location}`,
                                    )}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Block IP
                                  </DropdownMenuItem>
                                )
                              : (
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

      {/* Block IP Dialog */}
      <Dialog
        open={isBlockIPDialogOpen}
        onOpenChange={setIsBlockIPDialogOpen}
      >
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
                onChange={e => setNewBlockIP({
                  ...newBlockIP,
                  ip_address: e.target.value,
                })}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={newBlockIP.reason}
                onChange={e => setNewBlockIP({
                  ...newBlockIP,
                  reason: e.target.value,
                })}
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
                onCheckedChange={checked => setNewBlockIP({
                  ...newBlockIP,
                  is_permanent: checked,
                })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockIPDialogOpen(false)}
              disabled={isBlocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockIP}
              disabled={isBlocking}
            >
              {isBlocking
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Blocking...
                    </>
                  )
                : (
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
      <AlertDialog
        open={isUnblockDialogOpen}
        onOpenChange={setIsUnblockDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock
              {" "}
              <code className="bg-muted px-2 py-1 rounded">{selectedIPToUnblock?.ip_address}</code>
              ?
              This will allow access from this IP address again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIPToUnblock(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockIP}
              className="bg-success hover:bg-success/90"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Failed Attempt Details Dialog */}
      <Dialog
        open={!!selectedFailedAttempt}
        onOpenChange={open => !open && setSelectedFailedAttempt(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              Failed Attempt Details
            </DialogTitle>
            <DialogDescription>
              Information about this failed login attempt.
            </DialogDescription>
          </DialogHeader>
          {selectedFailedAttempt && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedFailedAttempt.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedFailedAttempt.ipAddress}</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedFailedAttempt.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  {getFailureReasonBadge(selectedFailedAttempt.reason)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attempts</p>
                  <Badge variant={selectedFailedAttempt.attempts >= 10 ? "destructive" : selectedFailedAttempt.attempts >= 5 ? "secondary" : "outline"}>
                    {selectedFailedAttempt.attempts}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {selectedFailedAttempt.blocked
                    ? (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )
                    : (
                        <Badge variant="outline">Active</Badge>
                      )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatDateInTimezone(
                      selectedFailedAttempt.timestamp,
                      timezone,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
