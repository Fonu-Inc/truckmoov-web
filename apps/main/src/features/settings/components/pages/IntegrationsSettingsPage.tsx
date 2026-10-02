import {
  CheckCircle, Mail, MapPin, Phone, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { AccountingIntegrationPanel } from "@/features/settings/components/ui/AccountingIntegrationPanel";

/**
 * ponytail: the catalogue of connectable services. Nothing reports connection
 * status yet, so every service shows as not connected until that endpoint exists.
 */
const CONNECTED_SERVICES = [
  {
    id: "whatsapp", name: "WhatsApp Business", icon: WhatsAppIcon, connected: false, description: "Send messages and notifications via WhatsApp",
  },
  {
    id: "sms", name: "SMS Gateway", icon: Phone, connected: false, description: "Send SMS notifications to drivers",
  },
  {
    id: "gmail", name: "Gmail", icon: Mail, connected: false, description: "Send emails using your Gmail account",
  },
  {
    id: "outlook", name: "Outlook", icon: Mail, connected: false, description: "Send emails using Microsoft Outlook",
  },
  {
    id: "maps", name: "Google Maps", icon: MapPin, connected: false, description: "Route optimization and live tracking",
  },
];

/** `/settings/integrations` — labelled "Connections" in the tab bar. */
export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <AccountingIntegrationPanel />

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>Manage third-party integrations and external services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONNECTED_SERVICES.map(integration => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${integration.connected ? "bg-primary/20" : "bg-muted"}`}>
                  <integration.icon className={`h-5 w-5 ${integration.connected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{integration.name}</p>
                    {integration.connected
                      ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        )
                      : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>
              <Button
                variant={integration.connected ? "outline" : "gradient"}
                size="sm"
                onClick={() => toast.success("Integration settings updated")}
              >
                {integration.connected ? "Configure" : "Connect"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
