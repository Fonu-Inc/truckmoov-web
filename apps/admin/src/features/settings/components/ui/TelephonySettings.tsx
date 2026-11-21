import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Mic,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";

const EMPTY = "—";

const STATUS_CARDS = [
  {
    label: "API Connection", icon: AlertTriangle,
  },
  {
    label: "Webhook", icon: AlertTriangle,
  },
];

const USAGE_TILES = [
  {
    label: "Total Calls", icon: Phone, tone: "primary",
  },
  {
    label: "Successful", icon: PhoneOutgoing, tone: "success",
  },
  {
    label: "Failed", icon: PhoneMissed, tone: "destructive",
  },
  {
    label: "Minutes Used", icon: Clock, tone: "warning",
  },
  {
    label: "Recordings", icon: Mic, tone: "primary",
  },
] as const;

const COST_TILES = [
  {
    label: "Outbound Calls", unit: "calls", icon: PhoneOutgoing, iconClass: "text-primary",
  },
  {
    label: "Inbound Calls", unit: "calls", icon: PhoneIncoming, iconClass: "text-success",
  },
  {
    label: "Recordings", unit: "recordings", icon: Mic, iconClass: "text-warning",
  },
];

// Full class strings so Tailwind keeps them.
const TONE_BG = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  destructive: "bg-destructive/10",
  warning: "bg-warning/10",
} as const;
const TONE_TEXT = {
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
} as const;

/**
 * ponytail: no telephony endpoint yet; layout kept, values show — until one
 * exists. Wire each card to its query when the backend lands.
 */
export function TelephonySettings() {
  return (
    <div className="space-y-6">
      {/* Connection Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Fonu Telephony Status
          </CardTitle>
          <CardDescription>
            Real-time connection health and API status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {STATUS_CARDS.map(card => (
              <Card
                key={card.label}
                className="border-border/50"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{card.label}</span>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary">Not configured</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">No status endpoint yet</p>
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-1">{EMPTY}</p>
                <p className="text-xs text-muted-foreground">No call data yet</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Usage</span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-1">{EMPTY}</p>
                <p className="text-xs text-muted-foreground">No usage data yet</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Call Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Call Volume & Usage
          </CardTitle>
          <CardDescription>
            Monthly telephony usage breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
            {USAGE_TILES.map(tile => (
              <div
                key={tile.label}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/30"
              >
                <div className={`p-2 rounded-full ${TONE_BG[tile.tone]}`}>
                  <tile.icon className={`h-5 w-5 ${TONE_TEXT[tile.tone]}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{EMPTY}</p>
                  <p className="text-sm text-muted-foreground">{tile.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Call Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Call Activity
              </CardTitle>
              <CardDescription>
                Real-time incoming and outgoing calls
              </CardDescription>
            </div>
            <Badge variant="secondary">0 Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PhoneCall className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No active calls at the moment</p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Tracking & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Cost Tracking & Billing
          </CardTitle>
          <CardDescription>
            Monthly telephony spend breakdown and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Monthly Budget</p>
                <p className="text-2xl font-bold">{EMPTY}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Current Spend</p>
                <p className="text-2xl font-bold">{EMPTY}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">No billing data yet</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {COST_TILES.map(tile => (
              <div
                key={tile.label}
                className="p-4 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <tile.icon className={`h-4 w-4 ${tile.iconClass}`} />
                  <span className="text-sm font-medium">{tile.label}</span>
                </div>
                <p className="text-xl font-bold">{EMPTY}</p>
                <p className="text-xs text-muted-foreground">
                  {EMPTY}
                  {" "}
                  {tile.unit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ponytail: Fonu API Configuration moved to /settings/telephony/config */}
    </div>
  );
}
