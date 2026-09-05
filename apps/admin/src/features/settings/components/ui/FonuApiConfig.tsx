import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

export function FonuApiConfig() {
  const [
    showApiKey,
    setShowApiKey,
  ] = useState(false);
  const [
    showApiSecret,
    setShowApiSecret,
  ] = useState(false);
  const [isTesting] = useState(false);

  const [
    fonuSettings,
    setFonuSettings,
  ] = useState({
    apiKey: "",
    apiSecret: "",
    webhookUrl: "",
    defaultCallerId: "+234",
    enableRecording: true,
    recordingRetentionDays: 90,
    transcriptionEnabled: true,
    defaultLanguage: "en",
  });

  const handleTestConnection = async () => {
    toast.info("Coming soon");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Fonu API Configuration
        </CardTitle>
        <CardDescription>
          Configure your Fonu telephony integration credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fonuApiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="fonuApiKey"
                  type={showApiKey ? "text" : "password"}
                  value={fonuSettings.apiKey}
                  onChange={e => setFonuSettings({
                    ...fonuSettings,
                    apiKey: e.target.value,
                  })}
                  placeholder="fonu_key_••••••••••••"
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(
                      fonuSettings.apiKey,
                      "API Key",
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Found in your Fonu dashboard under API settings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fonuApiSecret">API Secret</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="fonuApiSecret"
                  type={showApiSecret ? "text" : "password"}
                  value={fonuSettings.apiSecret}
                  onChange={e => setFonuSettings({
                    ...fonuSettings,
                    apiSecret: e.target.value,
                  })}
                  placeholder="••••••••••••••••"
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                  >
                    {showApiSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(
                      fonuSettings.apiSecret,
                      "API Secret",
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Webhook Configuration</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhookUrl"
                  value={fonuSettings.webhookUrl || `https://yntqriwlxuytworbzuux.supabase.co/functions/v1/fonu-webhook`}
                  onChange={e => setFonuSettings({
                    ...fonuSettings,
                    webhookUrl: e.target.value,
                  })}
                  placeholder="https://your-domain.com/webhooks/fonu"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(
                    fonuSettings.webhookUrl || `https://yntqriwlxuytworbzuux.supabase.co/functions/v1/fonu-webhook`,
                    "Webhook URL",
                  )}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this URL to your Fonu dashboard webhook settings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callerId">Default Caller ID</Label>
              <Input
                id="callerId"
                value={fonuSettings.defaultCallerId}
                onChange={e => setFonuSettings({
                  ...fonuSettings,
                  defaultCallerId: e.target.value,
                })}
                placeholder="+234 800 000 0000"
              />
              <p className="text-xs text-muted-foreground">
                Nigerian phone number for outbound calls
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Call Settings</h4>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Call Recording</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically record all calls for quality assurance
                </p>
              </div>
              <Switch
                checked={fonuSettings.enableRecording}
                onCheckedChange={checked => setFonuSettings({
                  ...fonuSettings,
                  enableRecording: checked,
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>AI Transcription</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-transcribe recordings with AI
                </p>
              </div>
              <Switch
                checked={fonuSettings.transcriptionEnabled}
                onCheckedChange={checked => setFonuSettings({
                  ...fonuSettings,
                  transcriptionEnabled: checked,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Recording Retention</Label>
              <Select
                value={fonuSettings.recordingRetentionDays.toString()}
                onValueChange={value => setFonuSettings({
                  ...fonuSettings,
                  recordingRetentionDays: parseInt(value),
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="180">180 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select
                value={fonuSettings.defaultLanguage}
                onValueChange={value => setFonuSettings({
                  ...fonuSettings,
                  defaultLanguage: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                  <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting
              ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )
              : (
                  <PhoneCall className="h-4 w-4 mr-2" />
                )}
            Test Connection
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <a
              href="https://fonu.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Fonu Dashboard
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
