import type {
  AIGovernance,
  AIProviderConfig,
  AIProviderKey,
} from "@truckmoov/api/auth";
import {
  useAIGovernance,
  useAIUsage,
  useUpdateAIGovernance,
  useUpdateOpenRouterCredential,
} from "@truckmoov/api/auth";
import {
  AlertTriangle, BarChart3, Bot, KeyRound, Loader2, Shield, Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";

/**
 * TRU-FE-7 § B — AI tab.
 *
 * ponytail: no Requests table yet — added when the endpoint has data to filter.
 *   Same reason the AI Defaults sub-tab is out of scope in the spec.
 */

function humanTool(t: string) {
  return t.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}

function ProviderCard({
  provider, availableTools, matchingEnabled, onPatch, isSaving,
}: {
  provider: AIProviderConfig;
  availableTools: string[];
  matchingEnabled: boolean;
  onPatch: (partial: Partial<AIProviderConfig>) => void;
  isSaving: boolean;
}) {
  const disabled = !matchingEnabled;
  return (
    <Card className={disabled ? "opacity-70" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              {provider.label}
            </CardTitle>
            <CardDescription>{provider.description}</CardDescription>
          </div>
          <Switch
            checked={provider.enabled}
            onCheckedChange={enabled => onPatch({ enabled })}
            disabled={disabled || isSaving}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Allowed models</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {provider.allowedModels.length === 0
              ? <p className="text-xs text-muted-foreground">None. Enable at least one to leave this provider on.</p>
              : provider.allowedModels.map(m => (
                  <div key={m} className="flex items-center justify-between rounded border border-border/40 px-2 py-1 text-sm">
                    <span className="font-mono text-xs">{m}</span>
                    {m === provider.defaultModel && <Badge variant="secondary" className="text-[10px]">default</Badge>}
                  </div>
                ))}
          </div>
          {/* ponytail: model checklist edit is a follow-up — the mock had it, the endpoint accepts it, but changing allowedModels here can leave the row's defaultModel dangling; do that in the Model Access panel when it lands. */}
        </div>

        <div className="space-y-2">
          <Label>Default model</Label>
          <Select
            value={provider.defaultModel}
            onValueChange={defaultModel => onPatch({ defaultModel })}
            disabled={disabled || isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provider.allowedModels.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Allowed tools</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {availableTools.map((t) => {
              const checked = provider.allowedTools.includes(t);
              return (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    disabled={disabled || isSaving}
                    onCheckedChange={(next) => {
                      const nextTools = next
                        ? Array.from(new Set([...provider.allowedTools, t]))
                        : provider.allowedTools.filter(x => x !== t);
                      onPatch({ allowedTools: nextTools });
                    }}
                  />
                  {humanTool(t)}
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RateLimitsCard({
  governance, onPatch, isSaving,
}: {
  governance: AIGovernance;
  onPatch: (partial: Partial<AIGovernance["rateLimits"]>) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState(governance.rateLimits);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(governance.rateLimits);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Rate limits
        </CardTitle>
        <CardDescription>Applied across every provider.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {(["maxTokensPerRequest", "maxRequestsPerMinute", "maxTokensPerDayPerTenant"] as const).map(k => (
            <div key={k} className="space-y-2">
              <Label>{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim()}</Label>
              <Input
                type="number"
                min={1}
                value={draft[k]}
                onChange={e => setDraft({ ...draft, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            disabled={!isDirty || isSaving}
            onClick={() => onPatch(draft)}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save rate limits
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DataProtectionCard({
  governance, onPatch, isSaving,
}: {
  governance: AIGovernance;
  onPatch: (partial: Partial<AIGovernance["dataProtection"]>) => void;
  isSaving: boolean;
}) {
  const items: Array<[keyof AIGovernance["dataProtection"], string, string]> = [
    ["redactPhoneNumbers", "Redact phone numbers", "Replace phone numbers in prompts before sending."],
    ["redactDriverNames", "Redact driver names", "Replace driver names in prompts before sending."],
    ["redactVehiclePlates", "Redact vehicle plates", "Replace registrations in prompts before sending."],
    ["storePromptsAndResponses", "Store prompts and responses", "Persist AI prompts and responses for audit."],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Data protection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(([key, label, desc]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <Label>{label}</Label>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={governance.dataProtection[key]}
              onCheckedChange={next => onPatch({ [key]: next })}
              disabled={isSaving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OpenRouterCredentialCard() {
  const mutation = useUpdateOpenRouterCredential();
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          OpenRouter credential
        </CardTitle>
        <CardDescription>
          Every provider reaches OpenRouter through this single key. Rotating it takes effect without a redeploy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enabled</Label>
            <p className="text-sm text-muted-foreground">Off blocks every AI call regardless of provider settings.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={mutation.isPending} />
        </div>
        <div className="space-y-2">
          <Label>API key</Label>
          <Input
            type="password"
            placeholder="sk-or-..."
            value={secret}
            onChange={e => setSecret(e.target.value)}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">The key is encrypted server-side and never returned on read.</p>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(
              { data: { category: "ai", enabled, ...(secret ? { secret } : {}) } },
              {
                onSuccess: () => {
                  toast.success("OpenRouter credential saved");
                  setSecret("");
                },
                onError: err => toast.error(err.message),
              },
            )}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageSummary() {
  const usageQuery = useAIUsage();
  const usage = usageQuery.data?.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usageQuery.isLoading
          ? <Skeleton className="h-16 w-full" />
          : !usage
              ? <p className="text-sm text-muted-foreground">Not available.</p>
              : (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Stat label="Total requests" value={usage.totalRequests.toLocaleString()} />
                    <Stat label="Total tokens" value={usage.totalTokens.toLocaleString()} />
                    <Stat
                      label="Success rate"
                      // Spec § B: null before anything runs — render dash, not 0.
                      value={usage.successRate == null ? "—" : `${(usage.successRate * 100).toFixed(1)}%`}
                    />
                    <Stat
                      label="Avg latency"
                      value={usage.averageLatencyMs == null ? "—" : `${Math.round(usage.averageLatencyMs)} ms`}
                    />
                  </div>
                )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function PlatformAISettings() {
  const governanceQuery = useAIGovernance();
  const patch = useUpdateAIGovernance();

  const governance = governanceQuery.data?.data;

  const patchWith = (payload: Parameters<typeof patch.mutate>[0]["data"]) => {
    patch.mutate(
      { data: payload },
      { onError: err => toast.error(err.message) },
    );
  };

  if (governanceQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (governanceQuery.isError || !governance) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Couldn't load AI settings</AlertTitle>
        <AlertDescription>
          {(governanceQuery.error as { message?: string })?.message ?? "Try again."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master switch. Spec § B: off means no AI call leaves the platform. */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI matching
              </CardTitle>
              <CardDescription>
                Master switch. Off blocks every AI call, whatever the providers say.
              </CardDescription>
            </div>
            <Switch
              checked={governance.matchingEnabled}
              onCheckedChange={next => patchWith({ matchingEnabled: next })}
              disabled={patch.isPending}
            />
          </div>
        </CardHeader>
      </Card>

      {!governance.matchingEnabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI is off</AlertTitle>
          <AlertDescription>
            Provider settings below are editable but won&apos;t take effect until you turn AI matching on.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="limits">Rate limits</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="credential">Credential</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-4 space-y-4">
          {governance.providers.map(p => (
            <ProviderCard
              key={p.provider}
              provider={p}
              availableTools={governance.availableTools}
              matchingEnabled={governance.matchingEnabled}
              isSaving={patch.isPending}
              onPatch={partial =>
                patchWith({ providers: [{ provider: p.provider as AIProviderKey, ...partial }] })}
            />
          ))}
        </TabsContent>

        <TabsContent value="limits" className="mt-4">
          <RateLimitsCard
            governance={governance}
            isSaving={patch.isPending}
            onPatch={partial => patchWith({ rateLimits: partial })}
          />
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <DataProtectionCard
            governance={governance}
            isSaving={patch.isPending}
            onPatch={partial => patchWith({ dataProtection: partial })}
          />
        </TabsContent>

        <TabsContent value="credential" className="mt-4">
          <OpenRouterCredentialCard />
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <UsageSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
