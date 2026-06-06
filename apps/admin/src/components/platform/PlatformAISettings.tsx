import { useState, useMemo } from "react";
import {
  Bot,
  Settings,
  Shield,
  BarChart3,
  Zap,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { ExportButton } from "@/components/shadcn/export-button";
import { Label as FilterLabel } from "@/components/shadcn/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Badge } from "@/components/shadcn/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Slider } from "@/components/shadcn/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-5", "gpt-5-mini", "gpt-5-nano"];
const ANTHROPIC_MODELS = ["claude-3.5-sonnet", "claude-3-sonnet", "claude-3-haiku", "claude-3-opus"];
const LOVABLE_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite", "gemini-3-flash-preview"];

export function PlatformAISettings() {
  const config: any = {
    ai_job_matching_enabled: false,
    openai_enabled: false,
    openai_allowed_models: [] as string[],
    anthropic_enabled: false,
    anthropic_allowed_models: [] as string[],
    lovable_enabled: true,
    lovable_allowed_models: [] as string[],
    max_tokens_per_request: 4000,
    max_requests_per_minute: 60,
    max_tokens_per_day_per_tenant: 100000,
    redact_phone_numbers: true,
    redact_driver_names: true,
    redact_vehicle_plates: true,
    store_prompts_responses: false,
    default_provider: "lovable" as "openai" | "anthropic" | "lovable",
    default_model: "",
  };
  const isLoading = false;
  const isSaving = false;
  const updateConfig = (_updates: any) => {};
  const logs: any[] = [];
  const stats: any = null;
  const [activeTab, setActiveTab] = useState("providers");
  const [logSearch, setLogSearch] = useState("");
  const [logStatus, setLogStatus] = useState("all");
  const [logFilters, setLogFilters] = useState<import("@/components/ui/table-toolbar").FilterValues>({});

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    const provider = logFilters.provider?.enabled ? logFilters.provider.value : null;
    const tokensFrom = logFilters.tokens?.enabled ? Number(logFilters.tokens.from) : null;
    const tokensTo = logFilters.tokens?.enabled ? Number(logFilters.tokens.to) : null;
    const dateAfter = logFilters.date?.enabled ? logFilters.date.date : null;

    return logs.filter((l) => {
      if (logStatus === "success" && !l.success) return false;
      if (logStatus === "failed" && l.success) return false;
      if (provider && l.provider !== provider) return false;
      if (tokensFrom !== null && !Number.isNaN(tokensFrom) && (l.tokens_used ?? 0) < tokensFrom) return false;
      if (tokensTo !== null && !Number.isNaN(tokensTo) && (l.tokens_used ?? 0) > tokensTo) return false;
      if (dateAfter && new Date(l.created_at) < new Date(dateAfter)) return false;
      if (!q) return true;
      return (
        l.tenant_id?.toLowerCase().includes(q) ||
        l.provider?.toLowerCase().includes(q) ||
        l.model?.toLowerCase().includes(q)
      );
    });
  }, [logs, logSearch, logStatus, logFilters]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <p>Failed to load AI configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Providers & Governance
          </h2>
          <p className="text-muted-foreground">
            Configure AI providers, models, and platform-wide guardrails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.ai_job_matching_enabled}
            onCheckedChange={(checked) => updateConfig({ ai_job_matching_enabled: checked })}
            disabled={isSaving}
          />
          <Label className="font-medium">
            {config.ai_job_matching_enabled ? "AI Matching Enabled" : "AI Matching Disabled"}
          </Label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="guardrails" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Guardrails
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Defaults
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* OpenAI */}
            <Card className={config.openai_enabled ? "border-primary/50" : "opacity-75"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">OpenAI</CardTitle>
                  <Switch
                    checked={config.openai_enabled}
                    onCheckedChange={(checked) => updateConfig({ openai_enabled: checked })}
                    disabled={isSaving}
                  />
                </div>
                <CardDescription>GPT-4o, GPT-5 models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Allowed Models</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {OPENAI_MODELS.map((model) => {
                      const isAllowed = config.openai_allowed_models?.includes(model);
                      return (
                        <Badge
                          key={model}
                          variant={isAllowed ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            const newModels = isAllowed
                              ? config.openai_allowed_models.filter((m) => m !== model)
                              : [...(config.openai_allowed_models || []), model];
                            updateConfig({ openai_allowed_models: newModels });
                          }}
                        >
                          {model}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anthropic */}
            <Card className={config.anthropic_enabled ? "border-primary/50" : "opacity-75"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Anthropic</CardTitle>
                  <Switch
                    checked={config.anthropic_enabled}
                    onCheckedChange={(checked) => updateConfig({ anthropic_enabled: checked })}
                    disabled={isSaving}
                  />
                </div>
                <CardDescription>Claude 3.5, Claude 3 models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Allowed Models</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ANTHROPIC_MODELS.map((model) => {
                      const isAllowed = config.anthropic_allowed_models?.includes(model);
                      return (
                        <Badge
                          key={model}
                          variant={isAllowed ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            const newModels = isAllowed
                              ? config.anthropic_allowed_models.filter((m) => m !== model)
                              : [...(config.anthropic_allowed_models || []), model];
                            updateConfig({ anthropic_allowed_models: newModels });
                          }}
                        >
                          {model}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lovable AI */}
            <Card className={config.lovable_enabled ? "border-primary/50" : "opacity-75"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lovable AI</CardTitle>
                  <Switch
                    checked={config.lovable_enabled}
                    onCheckedChange={(checked) => updateConfig({ lovable_enabled: checked })}
                    disabled={isSaving}
                  />
                </div>
                <CardDescription>Gemini models (Platform default)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Allowed Models</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {LOVABLE_MODELS.map((model) => {
                      const isAllowed = config.lovable_allowed_models?.includes(model);
                      return (
                        <Badge
                          key={model}
                          variant={isAllowed ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            const newModels = isAllowed
                              ? config.lovable_allowed_models.filter((m) => m !== model)
                              : [...(config.lovable_allowed_models || []), model];
                            updateConfig({ lovable_allowed_models: newModels });
                          }}
                        >
                          {model}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guardrails Tab */}
        <TabsContent value="guardrails" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Rate Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rate Limits
                </CardTitle>
                <CardDescription>Control API usage limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Tokens per Request</Label>
                  <Input
                    type="number"
                    value={config.max_tokens_per_request}
                    onChange={(e) =>
                      updateConfig({ max_tokens_per_request: parseInt(e.target.value) || 4000 })
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Requests per Minute</Label>
                  <Input
                    type="number"
                    value={config.max_requests_per_minute}
                    onChange={(e) =>
                      updateConfig({ max_requests_per_minute: parseInt(e.target.value) || 60 })
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens per Day per Tenant</Label>
                  <Input
                    type="number"
                    value={config.max_tokens_per_day_per_tenant}
                    onChange={(e) =>
                      updateConfig({
                        max_tokens_per_day_per_tenant: parseInt(e.target.value) || 100000,
                      })
                    }
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  Data Protection
                </CardTitle>
                <CardDescription>Redaction and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Redact Phone Numbers</Label>
                    <p className="text-xs text-muted-foreground">
                      Mask phone numbers in AI prompts
                    </p>
                  </div>
                  <Switch
                    checked={config.redact_phone_numbers}
                    onCheckedChange={(checked) => updateConfig({ redact_phone_numbers: checked })}
                    disabled={isSaving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Redact Driver Names</Label>
                    <p className="text-xs text-muted-foreground">Partially mask driver names</p>
                  </div>
                  <Switch
                    checked={config.redact_driver_names}
                    onCheckedChange={(checked) => updateConfig({ redact_driver_names: checked })}
                    disabled={isSaving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Redact Vehicle Plates</Label>
                    <p className="text-xs text-muted-foreground">
                      Mask registration numbers
                    </p>
                  </div>
                  <Switch
                    checked={config.redact_vehicle_plates}
                    onCheckedChange={(checked) => updateConfig({ redact_vehicle_plates: checked })}
                    disabled={isSaving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Store Prompts & Responses</Label>
                    <p className="text-xs text-muted-foreground">
                      For debugging (admin-only access)
                    </p>
                  </div>
                  <Switch
                    checked={config.store_prompts_responses}
                    onCheckedChange={(checked) =>
                      updateConfig({ store_prompts_responses: checked })
                    }
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Provider for Demo/Trial Tenants</CardTitle>
              <CardDescription>
                Used when tenants haven't configured their own AI provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Provider</Label>
                  <Select
                    value={config.default_provider}
                    onValueChange={(value: "openai" | "anthropic" | "lovable") =>
                      updateConfig({ default_provider: value })
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.openai_enabled && <SelectItem value="openai">OpenAI</SelectItem>}
                      {config.anthropic_enabled && (
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      )}
                      {config.lovable_enabled && (
                        <SelectItem value="lovable">Lovable AI (Gemini)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Select
                    value={config.default_model}
                    onValueChange={(value) => updateConfig({ default_model: value })}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.default_provider === "openai" &&
                        config.openai_allowed_models?.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      {config.default_provider === "anthropic" &&
                        config.anthropic_allowed_models?.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      {config.default_provider === "lovable" &&
                        config.lovable_allowed_models?.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Platform AI Usage</h3>
          </div>

          {stats && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {(stats.totalTokens / 1000).toFixed(1)}K
                  </div>
                  <p className="text-xs text-muted-foreground">Total Tokens</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.avgLatency.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Usage by Provider */}
          {stats && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Usage by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byProvider).map(([provider, data]) => (
                    <div key={provider} className="flex items-center justify-between">
                      <span className="capitalize">{provider}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {data.requests} requests
                        </span>
                        <Badge variant="outline">{(data.tokens / 1000).toFixed(1)}K tokens</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage by Tenant */}
          {stats && Object.keys(stats.byTenant).length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Usage by Tenant</CardTitle>
                <CardDescription>Token consumption and request counts per tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Avg Tokens/Req</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.byTenant)
                      .sort(([, a], [, b]) => b.tokens - a.tokens)
                      .slice(0, 10)
                      .map(([tenantId, data]) => (
                        <TableRow key={tenantId}>
                          <TableCell className="font-mono text-xs">
                            {tenantId.slice(0, 8)}...{tenantId.slice(-4)}
                          </TableCell>
                          <TableCell className="text-right">{data.requests}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{(data.tokens / 1000).toFixed(1)}K</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {data.requests > 0 ? Math.round(data.tokens / data.requests) : 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ 
                                    width: `${stats.totalTokens > 0 ? (data.tokens / stats.totalTokens) * 100 : 0}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs">
                                {stats.totalTokens > 0 
                                  ? ((data.tokens / stats.totalTokens) * 100).toFixed(1) 
                                  : 0}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Recent AI Requests</CardTitle>
              <ExportButton
                rows={filteredLogs}
                filename="ai-usage-logs"
                columns={[
                  { header: "Time", accessor: (l: any) => new Date(l.created_at).toISOString() },
                  { header: "Tenant", accessor: (l: any) => l.tenant_id },
                  { header: "Provider", accessor: (l: any) => l.provider },
                  { header: "Model", accessor: (l: any) => l.model },
                  { header: "Tokens", accessor: (l: any) => l.tokens_used },
                  { header: "Latency (ms)", accessor: (l: any) => l.latency_ms },
                  { header: "Status", accessor: (l: any) => (l.success ? "Success" : "Failed") },
                ]}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <TableToolbar
                search={logSearch}
                onSearchChange={setLogSearch}
                searchPlaceholder="Search tenant, provider, model..."
                status={logStatus}
                onStatusChange={setLogStatus}
                statusOptions={[
                  { value: "success", label: "Successful" },
                  { value: "failed", label: "Failed" },
                ]}
                filterEntity="requests"
                filterValues={logFilters}
                onFiltersApply={setLogFilters}
                filterFields={[
                  {
                    type: "select",
                    key: "provider",
                    label: "Provider",
                    options: [
                      { value: "openai", label: "OpenAI" },
                      { value: "anthropic", label: "Anthropic" },
                      { value: "lovable", label: "Lovable" },
                    ],
                  },
                  { type: "range", key: "tokens", label: "Tokens used" },
                  { type: "date", key: "date", label: "After date" },
                ]}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.tenant_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.model}</TableCell>
                      <TableCell>{log.tokens_used}</TableCell>
                      <TableCell>{log.latency_ms}ms</TableCell>
                      <TableCell>
                        {log.success ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-6">
                        No requests match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



