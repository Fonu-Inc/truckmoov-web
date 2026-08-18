import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Info,
  LinkIcon,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Shield,
  Star,
  Unlink,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  Alert, AlertDescription,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
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
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { WhatsAppTemplatesManager } from "./WhatsAppTemplatesManager";

type WhatsAppAccount = any;

type WhatsAppBusinessSetupProps = { tenantId: string };

export function WhatsAppBusinessSetup({ tenantId }: WhatsAppBusinessSetupProps) {
  const accounts: any[] = [];
  const isLoading = false;
  const canSend = false;
  const tenantStatus = null;
  const isConnecting = false;
  const isDisconnecting = false;
  const refetch = async (...args: any[]) => {};
  const startEmbeddedSignup = async (...args: any[]) => {};
  const disconnect = async (...args: any[]) => {};
  const setAsDefault = async (...args: any[]) => {};
  const sendTestMessage = async (...args: any[]) => {};

  const [
    testDialogOpen,
    setTestDialogOpen,
  ] = useState(false);
  const [
    testPhone,
    setTestPhone,
  ] = useState("");
  const [
    isSendingTest,
    setIsSendingTest,
  ] = useState(false);

  const defaultAccount = accounts.find(a => a.is_default_sender && a.status === "CONNECTED");
  const hasConnectedAccount = accounts.some(a => a.status === "CONNECTED");

  const handleSendTest = async () => {
    if (!testPhone) {
      toast.error("Please enter a phone number");
      return;
    }
    setIsSendingTest(true);
    try {
      await sendTestMessage(testPhone);
      setTestDialogOpen(false);
      setTestPhone("");
    }
    finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status: WhatsAppAccount["status"]) => {
    const config = {
      CONNECTED: {
        color: "bg-success", label: "Connected", icon: CheckCircle,
      },
      PENDING: {
        color: "bg-warning", label: "Pending", icon: Clock,
      },
      NOT_CONNECTED: {
        color: "bg-muted", label: "Not Connected", icon: XCircle,
      },
      NEEDS_ATTENTION: {
        color: "bg-destructive", label: "Needs Attention", icon: AlertTriangle,
      },
      DISABLED: {
        color: "bg-muted", label: "Disabled", icon: XCircle,
      },
    };
    const {
      color, label, icon: Icon,
    } = config[status] || config.NOT_CONNECTED;
    return (
      <Badge className={`${color} text-white gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Warning */}
      {tenantStatus !== "active" && (
        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your business verification (KYC) is not complete. You can connect WhatsApp, but messaging
            will be blocked until verification is approved.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="connection"
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger
            value="connection"
            className="flex items-center gap-2"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="connection"
          className="space-y-6"
        >
          {/* Connection Status Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${hasConnectedAccount ? "bg-success/20" : "bg-muted"}`}>
                    <WhatsAppIcon className={`h-6 w-6 ${hasConnectedAccount ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <CardTitle>WhatsApp Business API</CardTitle>
                    <CardDescription>
                      Connect your WhatsApp Business account to communicate with drivers
                    </CardDescription>
                  </div>
                </div>
                {hasConnectedAccount && getStatusBadge("CONNECTED")}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasConnectedAccount
                ? (
                    <NotConnectedState
                      isConnecting={isConnecting}
                      onConnect={startEmbeddedSignup}
                    />
                  )
                : (
                    <ConnectedState
                      accounts={accounts}
                      defaultAccount={defaultAccount}
                      canSend={canSend}
                      isDisconnecting={isDisconnecting}
                      onDisconnect={disconnect}
                      onSetDefault={setAsDefault}
                      onTestMessage={() => setTestDialogOpen(true)}
                      onRefresh={refetch}
                    />
                  )}
            </CardContent>
          </Card>

          {/* Usage Stats - Only show when connected */}
          {hasConnectedAccount && <UsageStatsCard tenantId={tenantId} />}
        </TabsContent>

        <TabsContent value="templates">
          <WhatsAppTemplatesManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>

      {/* Test Message Dialog */}
      <Dialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-success" />
              Send Test Message
            </DialogTitle>
            <DialogDescription>
              Send a test message to verify your WhatsApp connection is working.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+234 801 234 5678"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full phone number with country code
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={isSendingTest}
            >
              {isSendingTest
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  )
                : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== SUB-COMPONENTS ==============

function NotConnectedState({
  isConnecting,
  onConnect,
}: {
  isConnecting: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Connect your WhatsApp Business account using the embedded signup flow powered by
          {" "}
          <strong>Telconix Inc</strong>
          , FleetPro's Meta Tech Provider. This allows you to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Send messages to drivers via WhatsApp</li>
            <li>Receive incoming messages from drivers</li>
            <li>View complete message history</li>
            <li>No WhatsApp app installation required for drivers</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center py-8 space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
          <WhatsAppIcon className="h-12 w-12 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Connect WhatsApp Business</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Start the embedded signup process to connect your WhatsApp Business number and begin
          communicating with drivers instantly.
        </p>
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          size="lg"
          className="gap-2"
          variant="default"
        >
          {isConnecting
            ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              )
            : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Connect with WhatsApp
                </>
              )}
        </Button>
      </div>
    </div>
  );
}

function ConnectedState({
  accounts,
  defaultAccount,
  canSend,
  isDisconnecting,
  onDisconnect,
  onSetDefault,
  onTestMessage,
  onRefresh,
}: {
  accounts: WhatsAppAccount[];
  defaultAccount?: WhatsAppAccount;
  canSend: boolean;
  isDisconnecting: boolean;
  onDisconnect: (id: string) => void;
  onSetDefault: (id: string) => void;
  onTestMessage: () => void;
  onRefresh: () => void;
}) {
  const connectedAccounts = accounts.filter(a => a.status === "CONNECTED");

  return (
    <div className="space-y-4">
      {/* Default Sender Info */}
      {defaultAccount && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Business Name
            </div>
            <p className="font-medium">{defaultAccount.verified_name || "FleetPro Fleet"}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Business Phone
            </div>
            <p className="font-medium">{defaultAccount.display_phone_number || "Not set"}</p>
          </div>
        </div>
      )}

      {/* Quality & Verification */}
      {defaultAccount && (
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Connection Status
            </div>
            <div className="flex items-center gap-2">
              {defaultAccount.quality_rating && (
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Quality:
                  {" "}
                  {defaultAccount.quality_rating}
                </Badge>
              )}
              {defaultAccount.is_default_sender && (
                <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                  <Star className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Connected on
            {" "}
            {defaultAccount.connected_at
              ? formatDate(defaultAccount.connected_at)
              : "N/A"}
            {" via "}
            {defaultAccount.connection_method === "EMBEDDED_SIGNUP" ? "Embedded Signup" : "Admin Setup"}
          </p>
        </div>
      )}

      {/* Sending Status */}
      {!canSend && (
        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Messaging is disabled. Complete your business verification (KYC) to enable sending.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* All Connected Accounts */}
      {connectedAccounts.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Connected Accounts (
            {connectedAccounts.length}
            )
          </Label>
          <div className="space-y-2">
            {connectedAccounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{account.display_phone_number}</p>
                    <p className="text-xs text-muted-foreground">{account.verified_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.is_default_sender
                    ? (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          Default
                        </Badge>
                      )
                    : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetDefault(account.id)}
                        >
                          Set Default
                        </Button>
                      )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onTestMessage}
          className="gap-2"
          disabled={!canSend}
        >
          <Send className="h-4 w-4" />
          Send Test Message
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Sync Status
        </Button>
        {defaultAccount && (
          <Button
            variant="destructive"
            onClick={() => onDisconnect(defaultAccount.id)}
            disabled={isDisconnecting}
            className="gap-2 ml-auto"
          >
            {isDisconnecting
              ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                )
              : (
                  <>
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </>
                )}
          </Button>
        )}
      </div>
    </div>
  );
}

function UsageStatsCard({ tenantId }: { tenantId: string }) {
  // In a real implementation, fetch from whatsapp_messages table
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Usage Statistics
        </CardTitle>
        <CardDescription>WhatsApp messaging volume and delivery health for this tenant — track sends, receives, and reply rates.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-success">0</p>
            <p className="text-xs text-muted-foreground">Messages Sent</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Messages Received</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">--%</p>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Active Conversations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WhatsAppBusinessSetup;
