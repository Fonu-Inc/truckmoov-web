import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowRightLeft, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { defaultErpTmsEndpoints, EndpointSystemType, ErpTmsEndpointConfig } from "@/features/integrations/api";

const endpointSchema = z.object({
  name: z.string().trim().min(2, "Integration name is required"),
  systemType: z.enum(["ERP", "TMS", "BOTH"]),
  baseUrl: z.string().url("Base URL must be valid"),
  inboundPath: z.string().trim().min(1, "Inbound path is required").startsWith("/", "Inbound path must start with '/'") ,
  outboundPath: z.string().trim().min(1, "Outbound path is required").startsWith("/", "Outbound path must start with '/'") ,
  inboundJobWebhook: z.boolean(),
  outboundJobWebhook: z.boolean(),
  eventMapJobCreated: z.string().trim().min(1, "Job created mapping is required"),
  eventMapJobUpdated: z.string().trim().min(1, "Job updated mapping is required"),
  retryAttempts: z.coerce.number().int().min(0, "Minimum is 0").max(10, "Maximum is 10"),
  deadLetterQueue: z.boolean(),
});

type EndpointFormValues = z.infer<typeof endpointSchema>;

const defaultFormValues: EndpointFormValues = {
  name: "",
  systemType: "ERP",
  baseUrl: "",
  inboundPath: "/truckmoov/inbound/jobs",
  outboundPath: "/truckmoov/outbound/jobs",
  inboundJobWebhook: true,
  outboundJobWebhook: true,
  eventMapJobCreated: "create_order",
  eventMapJobUpdated: "update_order",
  retryAttempts: 3,
  deadLetterQueue: true,
};

const systemTypeBadge: Record<EndpointSystemType, "default" | "secondary" | "outline"> = {
  ERP: "default",
  TMS: "secondary",
  BOTH: "outline",
};

export default function ErpTmsSyncSection() {
  const [endpoints, setEndpoints] = useState<ErpTmsEndpointConfig[]>(defaultErpTmsEndpoints);

  const form = useForm<EndpointFormValues>({
    resolver: zodResolver(endpointSchema),
    defaultValues: defaultFormValues,
  });

  const onRegisterEndpoint = (values: EndpointFormValues) => {
    const nextEndpoint: ErpTmsEndpointConfig = {
      id: `${Date.now()}`,
      ...values,
      createdAt: new Date().toISOString(),
    };

    setEndpoints((current) => [nextEndpoint, ...current]);
    form.reset(defaultFormValues);
    toast.success("ERP/TMS endpoint registered");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          ERP/TMS Sync Configuration
        </CardTitle>
        <CardDescription>
          Configure endpoint registry, job webhook sync, event mapping, and retry/dead-letter behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onRegisterEndpoint)} className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Integration Name</Label>
              <Input id="name" placeholder="SAP ERP - Job Pipeline" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>System Type</Label>
              <Controller
                control={form.control}
                name="systemType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERP">ERP</SelectItem>
                      <SelectItem value="TMS">TMS</SelectItem>
                      <SelectItem value="BOTH">ERP + TMS</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input id="baseUrl" placeholder="https://integrations.example.com" {...form.register("baseUrl")} />
            {form.formState.errors.baseUrl && <p className="text-xs text-destructive">{form.formState.errors.baseUrl.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="inboundPath">Inbound Job Webhook Path</Label>
              <Input id="inboundPath" {...form.register("inboundPath")} />
              {form.formState.errors.inboundPath && <p className="text-xs text-destructive">{form.formState.errors.inboundPath.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="outboundPath">Outbound Job Webhook Path</Label>
              <Input id="outboundPath" {...form.register("outboundPath")} />
              {form.formState.errors.outboundPath && <p className="text-xs text-destructive">{form.formState.errors.outboundPath.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="eventMapJobCreated">Event Map: `job.created`</Label>
              <Input id="eventMapJobCreated" placeholder="create_order" {...form.register("eventMapJobCreated")} />
              {form.formState.errors.eventMapJobCreated && (
                <p className="text-xs text-destructive">{form.formState.errors.eventMapJobCreated.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="eventMapJobUpdated">Event Map: `job.updated`</Label>
              <Input id="eventMapJobUpdated" placeholder="update_order" {...form.register("eventMapJobUpdated")} />
              {form.formState.errors.eventMapJobUpdated && (
                <p className="text-xs text-destructive">{form.formState.errors.eventMapJobUpdated.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              control={form.control}
              name="inboundJobWebhook"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Enable inbound job sync</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="outboundJobWebhook"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Enable outbound job sync</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="deadLetterQueue"
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Use dead-letter queue</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-1 md:max-w-xs">
            <Label htmlFor="retryAttempts">Retry Attempts</Label>
            <Input id="retryAttempts" type="number" min={0} max={10} {...form.register("retryAttempts")} />
            {form.formState.errors.retryAttempts && (
              <p className="text-xs text-destructive">{form.formState.errors.retryAttempts.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={form.formState.isSubmitting} className="gap-2">
            <Plus className="h-4 w-4" />
            Register Endpoint
          </Button>
        </form>

        <div className="space-y-3">
          <p className="font-medium">Registered Endpoints</p>
          {endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ERP/TMS endpoints registered.</p>
          ) : (
            endpoints.map((endpoint) => (
              <div key={endpoint.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{endpoint.name}</p>
                  <Badge variant={systemTypeBadge[endpoint.systemType]}>{endpoint.systemType}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{endpoint.baseUrl}</p>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <p>Inbound: <code>{endpoint.inboundPath}</code></p>
                  <p>Outbound: <code>{endpoint.outboundPath}</code></p>
                  <p>Map `job.created`: <code>{endpoint.eventMapJobCreated}</code></p>
                  <p>Map `job.updated`: <code>{endpoint.eventMapJobUpdated}</code></p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Retries: {endpoint.retryAttempts} | DLQ: {endpoint.deadLetterQueue ? "Enabled" : "Disabled"} | Added {format(new Date(endpoint.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
