import { Bell } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

/**
 * `/settings/notifications`
 *
 * ponytail: nothing here is wired — every switch is an uncontrolled
 * `defaultChecked`, exactly as it arrived from the old tab. Left as-is because
 * there is no platform notification-preferences endpoint to save to yet.
 */
export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure platform-wide notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Admin Alerts</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Tenant Signup</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new tenant registers
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>System Errors</Label>
                  <p className="text-sm text-muted-foreground">
                    Critical system error notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Billing Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Failed payments and billing issues
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Suspicious activity and security events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Notification Channels</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notif"
                  defaultChecked
                />
                <Label htmlFor="email-notif">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sms-notif"
                  defaultChecked
                />
                <Label htmlFor="sms-notif">SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="slack-notif" />
                <Label htmlFor="slack-notif">Slack</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
