import {
  Key, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

/**
 * `/settings/api`
 *
 * ponytail: unwired like it was as a tab — the key, rate limit and webhook
 * secret are placeholders, and Regenerate does nothing. Moved verbatim.
 */
export default function ApiSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Manage API keys and rate limiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Public API</Label>
                <p className="text-sm text-muted-foreground">
                  Allow external API access
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Rate Limit (requests/minute)</Label>
              <Select defaultValue="100">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 requests/min</SelectItem>
                  <SelectItem value="100">100 requests/min</SelectItem>
                  <SelectItem value="500">500 requests/min</SelectItem>
                  <SelectItem value="1000">1000 requests/min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Webhook Configuration</h4>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input placeholder="https://your-server.com/webhooks" />
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  defaultValue="whsec_••••••••••••••••"
                  type="password"
                  className="flex-1"
                />
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
