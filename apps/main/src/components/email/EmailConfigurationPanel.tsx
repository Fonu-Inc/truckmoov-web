import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Shield,
  Settings,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface EmailAccount {
  id: string;
  provider: "gmail" | "outlook";
  email: string;
  connected: boolean;
  lastSync: Date | null;
  isPrimary: boolean;
}

export function EmailConfigurationPanel() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"gmail" | "outlook" | null>(null);
  
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([
    {
      id: "1",
      provider: "gmail",
      email: "dispatch@fleetpro.ng",
      connected: true,
      lastSync: new Date(Date.now() - 300000),
      isPrimary: true,
    },
  ]);

  const [emailSettings, setEmailSettings] = useState({
    autoSync: true,
    syncInterval: "5",
    notifyOnNew: true,
    signature: "Best regards,\nFleetPro Fleet Management",
    defaultSender: "dispatch@fleetpro.ng",
  });

  const handleConnectProvider = async (provider: "gmail" | "outlook") => {
    setIsConnecting(true);
    setSelectedProvider(provider);
    
    // Simulate OAuth flow
    setTimeout(() => {
      const oauthUrl = provider === "gmail" 
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
      
      toast.info(`Redirecting to ${provider === "gmail" ? "Google" : "Microsoft"} for authentication...`);
      
      // In a real implementation, this would redirect to the OAuth URL
      // For demo, we'll simulate a successful connection
      setTimeout(() => {
        const newAccount: EmailAccount = {
          id: Date.now().toString(),
          provider,
          email: provider === "gmail" ? "new.account@gmail.com" : "new.account@outlook.com",
          connected: true,
          lastSync: null,
          isPrimary: emailAccounts.length === 0,
        };
        setEmailAccounts((prev) => [...prev, newAccount]);
        setIsConnecting(false);
        setConnectDialogOpen(false);
        toast.success(`${provider === "gmail" ? "Gmail" : "Outlook"} account connected successfully`);
      }, 2000);
    }, 500);
  };

  const handleDisconnect = (accountId: string) => {
    setEmailAccounts((prev) => prev.filter((a) => a.id !== accountId));
    toast.success("Email account disconnected");
  };

  const handleSetPrimary = (accountId: string) => {
    setEmailAccounts((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === accountId }))
    );
    toast.success("Primary email account updated");
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setEmailAccounts((prev) =>
        prev.map((a) => ({ ...a, lastSync: new Date() }))
      );
      setIsSyncing(false);
      toast.success("Email synchronized successfully");
    }, 2000);
  };

  const getProviderIcon = (provider: "gmail" | "outlook") => {
    const colors = {
      gmail: "bg-red-500/10 text-red-500",
      outlook: "bg-blue-500/10 text-blue-500",
    };
    return (
      <div className={`p-2 rounded-lg ${colors[provider]}`}>
        <Mail className="h-5 w-5" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Accounts
              </CardTitle>
              <CardDescription>
                Connect Gmail or Outlook to send and receive emails
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={isSyncing || emailAccounts.length === 0}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Connect Email Account</DialogTitle>
                    <DialogDescription>
                      Choose your email provider to connect
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <button
                      onClick={() => handleConnectProvider("gmail")}
                      disabled={isConnecting}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="p-3 rounded-lg bg-red-500/10">
                        <Mail className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Gmail</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your Google Workspace or personal Gmail
                        </p>
                      </div>
                      {isConnecting && selectedProvider === "gmail" && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleConnectProvider("outlook")}
                      disabled={isConnecting}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <Mail className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Outlook / Microsoft 365</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your Microsoft work or personal account
                        </p>
                      </div>
                      {isConnecting && selectedProvider === "outlook" && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Your credentials are securely stored and encrypted</span>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {emailAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium">No email accounts connected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect Gmail or Outlook to start sending and receiving emails
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(account.provider)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.email}</p>
                        {account.isPrimary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                        {account.connected ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {account.lastSync
                          ? `Last synced ${account.lastSync.toLocaleTimeString()}`
                          : "Never synced"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(account.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure email synchronization and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Sync Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync new emails
                </p>
              </div>
              <Switch
                checked={emailSettings.autoSync}
                onCheckedChange={(checked) =>
                  setEmailSettings({ ...emailSettings, autoSync: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Sync Interval</Label>
              <Select
                value={emailSettings.syncInterval}
                onValueChange={(value) =>
                  setEmailSettings({ ...emailSettings, syncInterval: value })
                }
                disabled={!emailSettings.autoSync}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>New Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new emails arrive
                </p>
              </div>
              <Switch
                checked={emailSettings.notifyOnNew}
                onCheckedChange={(checked) =>
                  setEmailSettings({ ...emailSettings, notifyOnNew: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Default Sender</Label>
              <Select
                value={emailSettings.defaultSender}
                onValueChange={(value) =>
                  setEmailSettings({ ...emailSettings, defaultSender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.email}>
                      {account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Email Signature</Label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={emailSettings.signature}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, signature: e.target.value })
              }
              placeholder="Enter your email signature..."
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="gradient"
              onClick={() => toast.success("Email settings saved")}
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
