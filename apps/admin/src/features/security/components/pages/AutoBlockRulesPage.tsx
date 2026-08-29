import {
  Lock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
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

type AutoBlockingRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  maxAttempts: number;
  timeWindowMinutes: number;
  blockDurationHours: number | null;
};

export default function AutoBlockRulesPage() {
  // Auto IP blocking (hook removed — using inline defaults)
  const autoBlockingRules: AutoBlockingRule[] = [
    {
      id: "rule-1",
      name: "Brute Force Protection",
      description: "Block IPs with too many failed login attempts",
      enabled: true,
      maxAttempts: 10,
      timeWindowMinutes: 15,
      blockDurationHours: 24,
    },
    {
      id: "rule-2",
      name: "Rate Limit Guard",
      description: "Block IPs exceeding API rate limits",
      enabled: true,
      maxAttempts: 100,
      timeWindowMinutes: 60,
      blockDurationHours: 12,
    },
    {
      id: "rule-3",
      name: "OTP Abuse Prevention",
      description: "Block IPs abusing OTP verification",
      enabled: false,
      maxAttempts: 5,
      timeWindowMinutes: 10,
      blockDurationHours: 6,
    },
  ];
  const toggleRule = (_id: string) => {};
  const updateRule = (_id: string, _updates: Partial<AutoBlockingRule>) => {};

  return (
    <div className="space-y-6">
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
            {autoBlockingRules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border ${rule.enabled ? "border-primary/30 bg-primary/5" : "bg-muted/30"}`}
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
                            onChange={e => updateRule(
                              rule.id,
                              { maxAttempts: parseInt(e.target.value) || 5 },
                            )}
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
                            onChange={e => updateRule(
                              rule.id,
                              { timeWindowMinutes: parseInt(e.target.value) || 15 },
                            )}
                            className="w-20 h-8"
                          />
                          <span className="text-sm text-muted-foreground">minutes</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Block Duration</Label>
                        <div className="flex items-center gap-2">
                          {rule.blockDurationHours === null
                            ? (
                                <Badge variant="destructive">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Permanent
                                </Badge>
                              )
                            : (
                                <>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={8760}
                                    value={rule.blockDurationHours}
                                    onChange={e => updateRule(
                                      rule.id,
                                      { blockDurationHours: parseInt(e.target.value) || 24 },
                                    )}
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
    </div>
  );
}
