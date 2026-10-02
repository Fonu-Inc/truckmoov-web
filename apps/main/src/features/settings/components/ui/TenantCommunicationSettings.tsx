import {
  AlertCircle, CheckCircle2, Languages, MessageSquare, Phone,
  PhoneCall, Save,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { SenderIdManagement } from "./SenderIdManagement";

type CommunicationConfig = {
  id?: string;
  sms_sender_id: string | null;
  voice_caller_id: string | null;
  whatsapp_fallback_to_sms: boolean;
  sms_fallback_timeout_seconds: number;
  enable_delivery_notifications: boolean;
  enable_read_receipts: boolean;
  default_message_language: string;
};

type AssignedPhoneNumber = {
  id: string;
  phone_number: string;
  phone_number_type: "local" | "mobile" | "toll_free";
  capabilities: string[];
  status: string;
  monthly_cost_ngn: number | null;
};

const DEFAULT_CONFIG: CommunicationConfig = {
  sms_sender_id: null,
  voice_caller_id: null,
  whatsapp_fallback_to_sms: false,
  sms_fallback_timeout_seconds: 300,
  enable_delivery_notifications: true,
  enable_read_receipts: true,
  default_message_language: "en",
};

export function TenantCommunicationSettings() {
  const { user } = useAuthStore();
  const approvedSmsIds: any[] = [];
  const approvedVoiceIds: any[] = [];
  const [
    config,
    setConfig,
  ] = useState<CommunicationConfig>(DEFAULT_CONFIG);
  const [assignedNumbers] = useState<AssignedPhoneNumber[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [isSaving] = useState(false);
  const [
    hasChanges,
    setHasChanges,
  ] = useState(false);

  useEffect(
    () => {
      setIsLoading(false);
    },
    [user?.tenantId],
  );

  const handleChange = (key: keyof CommunicationConfig, value: any) => {
    setConfig(prev => ({
      ...prev, [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    toast.info("Coming soon");
  };

  // Combine platform-assigned numbers with approved sender IDs
  const smsCapableNumbers = assignedNumbers.filter(n => n.capabilities.includes("sms"));
  const voiceCapableNumbers = assignedNumbers.filter(n => n.capabilities.includes("voice"));

  // All available SMS options: assigned numbers + approved sender IDs
  const allSmsOptions = [
    ...smsCapableNumbers.map(n => ({
      id: n.id, value: n.phone_number, label: n.phone_number, source: "assigned" as const,
    })),
    ...approvedSmsIds.map(s => ({
      id: s.id, value: s.sender_id, label: s.sender_id, source: "approved" as const,
    })),
  ];

  const allVoiceOptions = [
    ...voiceCapableNumbers.map(n => ({
      id: n.id, value: n.phone_number, label: n.phone_number, source: "assigned" as const,
    })),
    ...approvedVoiceIds.map(s => ({
      id: s.id, value: s.sender_id, label: s.sender_id, source: "approved" as const,
    })),
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assigned Phone Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-primary" />
            My Phone Numbers
          </CardTitle>
          <CardDescription>
            Phone numbers assigned to your organization by the platform administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedNumbers.length === 0 && (
            <EmptyState
              icon={PhoneCall}
              title="No phone numbers assigned"
              description="Your platform administrator hasn't assigned any phone numbers to your organization yet."
            />
          )}
          <div className="space-y-3">
            {assignedNumbers.map(number => (
              <div
                key={number.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono font-medium">{number.phone_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {number.phone_number_type.replace(
                        "_",
                        " ",
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {number.capabilities.includes("sms") && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Badge>
                  )}
                  {number.capabilities.includes("voice") && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <PhoneCall className="h-3 w-3 mr-1" />
                      Voice
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sender ID Management */}
      <SenderIdManagement />

      {/* Sender ID Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Active Sender Configuration
          </CardTitle>
          <CardDescription>
            Select which approved sender ID to use for outbound communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sms_sender_id">SMS Sender ID</Label>
              {allSmsOptions.length > 0
                ? (
                    <Select
                      value={config.sms_sender_id || ""}
                      onValueChange={value => handleChange(
                        "sms_sender_id",
                        value,
                      )}
                    >
                      <SelectTrigger id="sms_sender_id">
                        <SelectValue placeholder="Select a sender ID..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allSmsOptions.map(opt => (
                          <SelectItem
                            key={opt.id}
                            value={opt.value}
                          >
                            {opt.label}
                            {opt.source === "assigned" && " (Assigned)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="text-sm">
                        No SMS sender IDs available. Request one above or contact your platform administrator.
                      </p>
                    </div>
                  )}
              <p className="text-xs text-muted-foreground">
                Only approved sender IDs and assigned numbers can be used
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice_caller_id">Voice Caller ID</Label>
              {allVoiceOptions.length > 0
                ? (
                    <Select
                      value={config.voice_caller_id || ""}
                      onValueChange={value => handleChange(
                        "voice_caller_id",
                        value,
                      )}
                    >
                      <SelectTrigger id="voice_caller_id">
                        <SelectValue placeholder="Select a caller ID..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allVoiceOptions.map(opt => (
                          <SelectItem
                            key={opt.id}
                            value={opt.value}
                          >
                            {opt.label}
                            {opt.source === "assigned" && " (Assigned)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="text-sm">
                        No voice caller IDs available. Request one above or contact your platform administrator.
                      </p>
                    </div>
                  )}
              <p className="text-xs text-muted-foreground">
                Only approved caller IDs and assigned numbers can be used
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fallback Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Message Fallback
          </CardTitle>
          <CardDescription>
            Configure automatic fallback when WhatsApp messages fail to deliver
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="fallback_sms">Enable SMS Fallback</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send SMS if WhatsApp delivery fails
              </p>
            </div>
            <Switch
              id="fallback_sms"
              checked={config.whatsapp_fallback_to_sms}
              onCheckedChange={checked => handleChange(
                "whatsapp_fallback_to_sms",
                checked,
              )}
            />
          </div>

          {config.whatsapp_fallback_to_sms && (
            <div className="space-y-2">
              <Label htmlFor="fallback_timeout">Fallback Timeout</Label>
              <Select
                value={config.sms_fallback_timeout_seconds.toString()}
                onValueChange={value => handleChange(
                  "sms_fallback_timeout_seconds",
                  parseInt(value),
                )}
              >
                <SelectTrigger id="fallback_timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Time to wait for WhatsApp delivery before sending SMS
              </p>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="delivery_notifications">Delivery Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when messages are delivered
              </p>
            </div>
            <Switch
              id="delivery_notifications"
              checked={config.enable_delivery_notifications}
              onCheckedChange={checked => handleChange(
                "enable_delivery_notifications",
                checked,
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="read_receipts">Read Receipts</Label>
              <p className="text-sm text-muted-foreground">
                Track when messages are read by drivers
              </p>
            </div>
            <Switch
              id="read_receipts"
              checked={config.enable_read_receipts}
              onCheckedChange={checked => handleChange(
                "enable_read_receipts",
                checked,
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Language Preferences
          </CardTitle>
          <CardDescription>
            Default language for automated messages and templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default_language">Default Message Language</Label>
            <Select
              value={config.default_message_language}
              onValueChange={value => handleChange(
                "default_message_language",
                value,
              )}
            >
              <SelectTrigger
                id="default_language"
                className="w-full md:w-64"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="yo">Yorùbá</SelectItem>
                <SelectItem value="ig">Igbo</SelectItem>
                <SelectItem value="ha">Hausa</SelectItem>
                <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Communication Settings"}
        </Button>
      </div>
    </div>
  );
}
