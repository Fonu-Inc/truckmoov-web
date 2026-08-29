import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Ban,
  Clock,
  Loader2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
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
import type { BlockedIP } from "@/features/security/types";
import { DEMO_BLOCKED_IPS } from "@/features/security/utils/mocks";

const BLOCKED_IP_FILTER_FIELDS: FilterField[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      {
        value: "permanent",
        label: "Permanent",
      },
      {
        value: "temporary",
        label: "Temporary",
      },
    ],

  },
  {
    key: "blocked_at",
    label: "Blocked At",
    type: "date",
  },
  {
    key: "expires_at",
    label: "Expires At",
    type: "date",
  },
];

export default function BlockedIpsPage() {
  const { timezone } = usePreferences();
  const [
    blockedIPSearch,
    setBlockedIPSearch,
  ] = useState("");
  const [
    blockedIPFilters,
    setBlockedIPFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(BLOCKED_IP_FILTER_FIELDS));

  // IP Blocking state (hooks removed — using inline defaults)
  const rawBlockedIPs: BlockedIP[] = [];
  const isLoadingIPs = false;
  const blockIP = async (_ip: string, _reason: string, _opts?: { isPermanent?: boolean }) => false;
  const unblockIP = async (_ip: string) => false;

  const dbBlockedIPs = rawBlockedIPs.length > 0 ? rawBlockedIPs : DEMO_BLOCKED_IPS;

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
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                Blocked IP Addresses
              </CardTitle>
              <CardDescription>
                IP addresses currently denied platform access — manually blocked or auto-blocked from suspicious activity.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setIsBlockIPDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Block IP
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP address or reason..."
                value={blockedIPSearch}
                onChange={e => setBlockedIPSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <PlatformFilterPopover
              entity="blocked IPs"
              fields={BLOCKED_IP_FILTER_FIELDS}
              value={blockedIPFilters}
              onApply={setBlockedIPFilters}
              onReset={() => setBlockedIPFilters(buildEmptyDraft(BLOCKED_IP_FILTER_FIELDS))}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingIPs
            ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )
            : dbBlockedIPs.length === 0
              ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No Blocked IPs</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      No IP addresses are currently blocked. You can block suspicious IPs from the Failed Attempts tab or add them manually.
                    </p>
                  </div>
                )
              : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>
                            Blocked At (
                            {TIMEZONES[timezone].offset}
                            )
                          </TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbBlockedIPs.filter((blocked) => {
                          const q = blockedIPSearch.trim().toLowerCase();
                          if (q && !blocked.ip_address.toLowerCase().includes(q) && !(blocked.reason || "").toLowerCase().includes(q))
                            return false;
                          const typeF = blockedIPFilters.type;
                          if (typeF?.enabled && typeF.value) {
                            if (typeF.value === "permanent" && !blocked.is_permanent)
                              return false;
                            if (typeF.value === "temporary" && blocked.is_permanent)
                              return false;
                          }
                          const blockedAtF = blockedIPFilters.blocked_at;
                          if (blockedAtF?.enabled && blockedAtF.value && !blocked.blocked_at.startsWith(blockedAtF.value))
                            return false;
                          const expiresF = blockedIPFilters.expires_at;
                          if (expiresF?.enabled && expiresF.value) {
                            if (!blocked.expires_at || !blocked.expires_at.startsWith(expiresF.value))
                              return false;
                          }
                          return true;
                        }).map(blocked => (
                          <TableRow key={blocked.id}>
                            <TableCell>
                              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{blocked.ip_address}</code>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-[250px] truncate">{blocked.reason}</p>
                            </TableCell>
                            <TableCell>
                              {blocked.is_permanent
                                ? (
                                    <Badge variant="destructive">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Permanent
                                    </Badge>
                                  )
                                : (
                                    <Badge variant="secondary">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Temporary
                                    </Badge>
                                  )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatDateInTimezone(
                                  blocked.blocked_at,
                                  timezone,
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {blocked.expires_at
                                ? (
                                    <span className="text-sm">
                                      {formatDateInTimezone(
                                        blocked.expires_at,
                                        timezone,
                                        {
                                          month: "short",
                                          day: "numeric",
                                        },
                                      )}
                                    </span>
                                  )
                                : (
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
    </div>
  );
}
