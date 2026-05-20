import { useState } from "react";
import {
  Bot,
  Key,
  Sliders,
  Shield,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTenantAIConfig } from "@/hooks/useTenantAIConfig";
import { usePlatformAIConfig } from "@/hooks/usePlatformAIConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useAIConfigPermissions } from "@/hooks/useAIConfigPermissions";

interface TenantAIConfigPanelProps {
  tenantId: string;
}

export function TenantAIConfigPanel({ tenantId }: TenantAIConfigPanelProps) {
  const { config, isLoading, isSaving, isTesting, createOrUpdateConfig, testConnection } =
    useTenantAIConfig(tenantId);
  const { config: platformConfig, isLoading: isLoadingPlatform } = usePlatformAIConfig();
  const { canConfigureTenantAI, canRunAIMatching } = useAIConfigPermissions();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  if (isLoading || isLoadingPlatform) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!canConfigureTenantAI && !canRunAIMatching) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have permission to view or configure AI settings. Contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  if (!platformConfig?.ai_job_matching_enabled) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Job Matching Disabled</AlertTitle>
        <AlertDescription>
          AI Job Matching is currently disabled platform-wide. Contact your platform administrator
          to enable this feature.
        </AlertDescription>
      </Alert>
    );
  }

  const getAvailableModels = (provider: string) => {
    switch (provider) {
      case "openai":
        return platformConfig?.openai_allowed_models || [];
      case "anthropic":
        return platformConfig?.anthropic_allowed_models || [];
      case "lovable":
        return platformConfig?.lovable_allowed_models || [];
      default:
        return [];
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput) {
      createOrUpdateConfig({
        api_key_encrypted: apiKeyInput,
        api_key_last_four: apiKeyInput.slice(-4),
      });
      setApiKeyInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Job Matching Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure AI-assisted truck and driver matching for your fleet
          </p>
        </div>
        {canConfigureTenantAI && (
          <div className="flex items-center gap-2">
            <Switch
              checked={config?.enabled ?? false}
              onCheckedChange={(checked) => createOrUpdateConfig({ enabled: checked })}
              disabled={isSaving}
            />
            <Label className="font-medium">
              {config?.enabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        )}
        {!canConfigureTenantAI && (
          <Badge variant="secondary">View Only</Badge>
        )}
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Provider & Model
          </CardTitle>
          <CardDescription>Select your preferred AI provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              {!config?.enabled && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Enable AI above to select a provider
                </p>
              )}
              <Select
                value={config?.provider || undefined}
                onValueChange={(value: "openai" | "anthropic" | "lovable") =>
                  createOrUpdateConfig({ provider: value, model: getAvailableModels(value)[0] })
                }
                disabled={isSaving || !config?.enabled || !canConfigureTenantAI}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {platformConfig?.openai_enabled && (
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  )}
                  {platformConfig?.anthropic_enabled && (
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  )}
                  {platformConfig?.lovable_enabled && (
                    <SelectItem value="lovable">Lovable AI (Default)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={config?.model || undefined}
                onValueChange={(value) => createOrUpdateConfig({ model: value })}
                disabled={isSaving || !config?.enabled || !config?.provider || !canConfigureTenantAI}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableModels(config?.provider || "").map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* API Key (BYOK) - Only for OpenAI and Anthropic */}
          {config?.provider && config.provider !== "lovable" && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key (Bring Your Own Key)
              </Label>
              <p className="text-xs text-muted-foreground">
                Provide your own API key for {config.provider === "openai" ? "OpenAI" : "Anthropic"}
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder={
                      config.api_key_last_four
                        ? `••••••••${config.api_key_last_four}`
                        : "Enter API key"
                    }
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput || isSaving}
                  variant="secondary"
                >
                  Save Key
                </Button>
              </div>
            </div>
          )}

          {/* Connection Test */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Test Connection</Label>
              {config?.last_connection_test_at && (
                <p className="text-xs text-muted-foreground">
                  Last tested: {format(new Date(config.last_connection_test_at), "PPp")}
                  {config.last_connection_test_success ? (
                    <Check className="inline ml-1 h-3 w-3 text-green-500" />
                  ) : (
                    <X className="inline ml-1 h-3 w-3 text-destructive" />
                  )}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={isTesting || !config?.enabled || !config?.provider}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matching Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Matching Policy
          </CardTitle>
          <CardDescription>Configure how AI ranks truck and driver matches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weight Sliders */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Priority Weights</Label>
            
            <div className="space-y-4">
              {[
                { key: "weight_capacity_fit", label: "Capacity Fit", value: config?.weight_capacity_fit ?? 80 },
                { key: "weight_distance_pickup", label: "Distance to Pickup", value: config?.weight_distance_pickup ?? 70 },
                { key: "weight_eta_delivery", label: "ETA / Delivery Time", value: config?.weight_eta_delivery ?? 60 },
                { key: "weight_driver_availability", label: "Driver Availability", value: config?.weight_driver_availability ?? 75 },
                { key: "weight_cost_efficiency", label: "Cost Efficiency", value: config?.weight_cost_efficiency ?? 50 },
              ].map((weight) => (
                <div key={weight.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{weight.label}</Label>
                    <span className="text-sm text-muted-foreground">{weight.value}%</span>
                  </div>
                  <Slider
                    value={[weight.value]}
                    onValueChange={([value]) =>
                      createOrUpdateConfig({ [weight.key]: value } as any)
                    }
                    max={100}
                    step={5}
                    disabled={isSaving || !config?.enabled}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Hard Constraints */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Hard Constraints</Label>
            <p className="text-xs text-muted-foreground">
              These constraints must be satisfied for a match to be considered
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "constraint_max_load", label: "Maximum Load Capacity", checked: config?.constraint_max_load ?? true },
                { key: "constraint_truck_type", label: "Truck Type Suitability", checked: config?.constraint_truck_type ?? true },
                { key: "constraint_refrigeration", label: "Refrigeration Requirements", checked: config?.constraint_refrigeration ?? true },
                { key: "constraint_driver_hours", label: "Driver Hours Compliance", checked: config?.constraint_driver_hours ?? true },
              ].map((constraint) => (
                <div key={constraint.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={constraint.key}
                    checked={constraint.checked}
                    onCheckedChange={(checked) =>
                      createOrUpdateConfig({ [constraint.key]: checked } as any)
                    }
                    disabled={isSaving || !config?.enabled}
                  />
                  <Label htmlFor={constraint.key} className="text-sm">
                    {constraint.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Confidence Threshold</Label>
              <span className="text-sm text-muted-foreground">
                {((config?.confidence_threshold ?? 0.75) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only suggest matches with confidence above this threshold
            </p>
            <Slider
              value={[(config?.confidence_threshold ?? 0.75) * 100]}
              onValueChange={([value]) =>
                createOrUpdateConfig({ confidence_threshold: value / 100 })
              }
              max={100}
              min={50}
              step={5}
              disabled={isSaving || !config?.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Human-in-the-Loop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Human-in-the-Loop
          </CardTitle>
          <CardDescription>Control dispatcher approval requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Dispatcher Approval</Label>
              <p className="text-xs text-muted-foreground">
                Dispatchers must confirm AI suggestions before dispatch
              </p>
            </div>
            <Switch
              checked={config?.require_dispatcher_approval ?? true}
              onCheckedChange={(checked) =>
                createOrUpdateConfig({ require_dispatcher_approval: checked })
              }
              disabled={isSaving || !config?.enabled}
            />
          </div>
          
          {!config?.require_dispatcher_approval && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Disabling dispatcher approval allows AI to auto-dispatch without human review.
                This is not recommended for production use.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
