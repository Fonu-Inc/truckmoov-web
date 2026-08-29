import {
  AlertTriangle,
  Ban,
  Bell,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

export default function NotificationsPage() {
  // Security alerts (hook removed — using inline defaults)
  const [
    alertConfig,
    setAlertConfig,
  ] = useState({
    enabled: false,
    recipientEmail: "",
    alertOnAutoBlock: true,
    alertOnCriticalEvents: true,
    alertOnSuspiciousActivity: true,
  });
  const updateAlertConfig = (updates: Partial<typeof alertConfig>) => setAlertConfig(prev => ({
    ...prev,
    ...updates,
  }));
  const sendTestAlert = () => {};
  const isSendingAlert = false;

  return (
    <div className="space-y-6">
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
                onCheckedChange={checked => updateAlertConfig({ enabled: checked })}
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
                  onChange={e => updateAlertConfig({ recipientEmail: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={sendTestAlert}
                  disabled={!alertConfig.recipientEmail || isSendingAlert}
                >
                  {isSendingAlert
                    ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )
                    : (
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
                  onCheckedChange={checked => updateAlertConfig({ alertOnAutoBlock: checked })}
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
                  onCheckedChange={checked => updateAlertConfig({ alertOnCriticalEvents: checked })}
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
                  onCheckedChange={checked => updateAlertConfig({ alertOnSuspiciousActivity: checked })}
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
    </div>
  );
}
