import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye, EyeOff, RotateCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  defaultIpAllowlistEntries,
  defaultWebhookSecurityConfig,
  IpAllowlistEntry,
  WebhookSecurityConfig,
} from "@/features/integrations/api";

const webhookSecuritySchema = z.object({
  signatureHeader: z.string().min(1, "Signature header is required"),
  timestampHeader: z.string().min(1, "Timestamp header is required"),
  algorithm: z.enum(["HMAC_SHA256", "HMAC_SHA512"]),
  enforceSignatureValidation: z.boolean(),
  enforceIpAllowlist: z.boolean(),
  rejectUnsignedPayloads: z.boolean(),
});

const ipEntrySchema = z.object({
  value: z.string().trim().min(1, "IP address or CIDR is required").refine(isValidIpOrCidr, {
    message: "Enter a valid IPv4 address or CIDR block",
  }),
  description: z.string().trim().min(2, "Description must be at least 2 characters"),
});

type WebhookSecurityFormValues = z.infer<typeof webhookSecuritySchema>;
type IpEntryFormValues = z.infer<typeof ipEntrySchema>;

function isValidIpOrCidr(value: string) {
  const ipv4Segment = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
  const ipv4 = new RegExp(`^${ipv4Segment}(\\.${ipv4Segment}){3}$`);
  const cidr = new RegExp(`^${ipv4Segment}(\\.${ipv4Segment}){3}\\/(3[0-2]|[12]?\\d)$`);
  return ipv4.test(value) || cidr.test(value);
}

function generateSigningSecret() {
  return `whsec_${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`;
}

export default function WebhookAuthenticitySection() {
  const [securityConfig, setSecurityConfig] = useState<WebhookSecurityConfig>(defaultWebhookSecurityConfig);
  const [allowlistEntries, setAllowlistEntries] = useState<IpAllowlistEntry[]>(defaultIpAllowlistEntries);
  const [signingSecret, setSigningSecret] = useState("whsec_bx4r8pw8ju4u2t3k5bgx3shqw8fs7vba");
  const [showSecret, setShowSecret] = useState(false);

  const securityForm = useForm<WebhookSecurityFormValues>({
    resolver: zodResolver(webhookSecuritySchema),
    defaultValues: securityConfig,
  });

  const allowlistForm = useForm<IpEntryFormValues>({
    resolver: zodResolver(ipEntrySchema),
    defaultValues: { value: "", description: "" },
  });

  const maskedSecret = useMemo(() => {
    if (showSecret) return signingSecret;
    if (signingSecret.length < 12) return "********";
    return `${signingSecret.slice(0, 8)}${"*".repeat(20)}${signingSecret.slice(-4)}`;
  }, [showSecret, signingSecret]);

  const onSaveSecurityConfig = (values: WebhookSecurityFormValues) => {
    setSecurityConfig(values);
    securityForm.reset(values);
    toast.success("Webhook verification policy saved");
  };

  const onAddAllowlistEntry = (values: IpEntryFormValues) => {
    const nextEntry: IpAllowlistEntry = {
      id: `${Date.now()}`,
      value: values.value,
      description: values.description,
      addedAt: new Date().toISOString(),
    };

    setAllowlistEntries((current) => [nextEntry, ...current]);
    allowlistForm.reset();
    toast.success("IP allowlist entry added");
  };

  const onDeleteAllowlistEntry = (entryId: string) => {
    setAllowlistEntries((current) => current.filter((entry) => entry.id !== entryId));
    toast.success("IP allowlist entry removed");
  };

  const onRegenerateSecret = () => {
    setSigningSecret(generateSigningSecret());
    toast.success("Signing secret regenerated");
  };

  const onCopySecret = async () => {
    await navigator.clipboard.writeText(signingSecret);
    toast.success("Signing secret copied");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Webhook Authenticity Controls
        </CardTitle>
        <CardDescription>
          Configure signature verification and IP allowlist rules to prevent webhook spoofing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Signing Secret</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use this shared secret in your backend to verify incoming signature headers.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={maskedSecret} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => setShowSecret((s) => !s)}>
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={onCopySecret}>Copy</Button>
            <Button variant="outline" onClick={onRegenerateSecret} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Rotate
            </Button>
          </div>
        </div>

        <form onSubmit={securityForm.handleSubmit(onSaveSecurityConfig)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signatureHeader">Signature Header</Label>
              <Input id="signatureHeader" {...securityForm.register("signatureHeader")} />
              {securityForm.formState.errors.signatureHeader && (
                <p className="text-xs text-destructive">{securityForm.formState.errors.signatureHeader.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestampHeader">Timestamp Header</Label>
              <Input id="timestampHeader" {...securityForm.register("timestampHeader")} />
              {securityForm.formState.errors.timestampHeader && (
                <p className="text-xs text-destructive">{securityForm.formState.errors.timestampHeader.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Signature Algorithm</Label>
            <Controller
              control={securityForm.control}
              name="algorithm"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HMAC_SHA256">HMAC_SHA256</SelectItem>
                    <SelectItem value="HMAC_SHA512">HMAC_SHA512</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              control={securityForm.control}
              name="enforceSignatureValidation"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Enforce signature</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />

            <Controller
              control={securityForm.control}
              name="enforceIpAllowlist"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Enforce IP allowlist</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />

            <Controller
              control={securityForm.control}
              name="rejectUnsignedPayloads"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Reject unsigned payloads</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />
          </div>

          <Button type="submit" isLoading={securityForm.formState.isSubmitting}>Save Verification Policy</Button>
        </form>

        <div className="space-y-4">
          <div>
            <p className="font-medium">IP Allowlist</p>
            <p className="text-xs text-muted-foreground">Add trusted ingress IPs/CIDR ranges for webhook origins.</p>
          </div>

          <form onSubmit={allowlistForm.handleSubmit(onAddAllowlistEntry)} className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
            <div className="space-y-1">
              <Label htmlFor="allowlistValue">IP or CIDR</Label>
              <Input id="allowlistValue" placeholder="34.120.10.0/24" {...allowlistForm.register("value")} />
              {allowlistForm.formState.errors.value && (
                <p className="text-xs text-destructive">{allowlistForm.formState.errors.value.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="allowlistDescription">Description</Label>
              <Input id="allowlistDescription" placeholder="Provider production cluster" {...allowlistForm.register("description")} />
              {allowlistForm.formState.errors.description && (
                <p className="text-xs text-destructive">{allowlistForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">Add Entry</Button>
            </div>
          </form>

          <div className="space-y-2">
            {allowlistEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allowlist entries added yet.</p>
            ) : (
              allowlistEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{entry.value}</code>
                      <Badge variant="secondary">{entry.description}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(entry.addedAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => onDeleteAllowlistEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
