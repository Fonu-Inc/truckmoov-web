import {
  useConsoleWebhooks, usePauseConsoleWebhook, useRegisterConsoleWebhook,
} from "@truckmoov/api/console";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import {
  Clock, Copy, ExternalLink, Eye, PauseCircle, Plus, RefreshCw, Webhook,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Switch } from "@/components/shadcn/switch";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

// ponytail: the console OpenAPI types `eventTypes` as free-form strings and
// enumerates none, so the pickable set lives here on the client.
const WEBHOOK_EVENT_TYPES: {
  value: string; label: string; category: string;
}[] = [
  {
    value: "job.created", label: "Job Created", category: "Jobs",
  },
  {
    value: "job.updated", label: "Job Updated", category: "Jobs",
  },
  {
    value: "job.offer.sent", label: "Job Offer Sent", category: "Jobs",
  },
  {
    value: "job.offer.accepted", label: "Job Offer Accepted", category: "Jobs",
  },
  {
    value: "job.offer.declined", label: "Job Offer Declined", category: "Jobs",
  },
  {
    value: "job.completed", label: "Job Completed", category: "Jobs",
  },
  {
    value: "job.cancelled", label: "Job Cancelled", category: "Jobs",
  },
  {
    value: "geofence.enter", label: "Geofence Entry", category: "Geofencing",
  },
  {
    value: "geofence.exit", label: "Geofence Exit", category: "Geofencing",
  },
  {
    value: "geofence.dwell.exceeded", label: "Geofence Dwell Exceeded", category: "Geofencing",
  },
  {
    value: "device.status.changed", label: "Device Status Changed", category: "Fleet",
  },
  {
    value: "sla.breached", label: "SLA Breached", category: "Operations",
  },
  {
    value: "maintenance.due", label: "Maintenance Due", category: "Operations",
  },
  {
    value: "fuel.anomaly.detected", label: "Fuel Anomaly Detected", category: "Operations",
  },
  {
    value: "alert.created", label: "Alert Created", category: "Alerts",
  },
];

export function WebhookManagementPanel() {
  const {
    data, isLoading, isError, refetch,
  } = useConsoleWebhooks();
  const subscriptions = data?.data ?? [];

  const registerWebhook = useRegisterConsoleWebhook();
  const pauseWebhook = usePauseConsoleWebhook();

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false);
  const [
    newWebhookName,
    setNewWebhookName,
  ] = useState("");
  const [
    newWebhookUrl,
    setNewWebhookUrl,
  ] = useState("");
  const [
    selectedEventTypes,
    setSelectedEventTypes,
  ] = useState<string[]>([]);
  const [
    showSecrets,
    setShowSecrets,
  ] = useState<Record<string, boolean>>({});
  // The signing secret is returned once, on registration — the list endpoint
  // never returns it again, so keep the ones seen this session.
  const [
    revealedSecrets,
    setRevealedSecrets,
  ] = useState<Record<string, string>>({});

  const handleCreateWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (selectedEventTypes.length === 0) {
      toast.error("Please select at least one event type");
      return;
    }

    try {
      void new URL(newWebhookUrl);
    }
    catch {
      toast.error("Please enter a valid URL");
      return;
    }

    registerWebhook.mutate(
      {
        data: {
          url: newWebhookUrl.trim(),
          eventTypes: selectedEventTypes,
        },
      },
      {
        onSuccess: (response) => {
          const registered = response.data;
          setIsCreateDialogOpen(false);
          setNewWebhookName("");
          setNewWebhookUrl("");
          setSelectedEventTypes([]);
          if (registered.signingSecret) {
            setRevealedSecrets(prev => ({
              ...prev, [registered.id]: registered.signingSecret!,
            }));
          }
          toast.success("Webhook registered. Copy its signing secret now, it is shown only once");
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handlePauseWebhook = (id: string) => {
    pauseWebhook.mutate(
      { id },
      {
        onSuccess: () => toast.success("Webhook paused"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Signing secret copied to clipboard");
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [
            ...prev,
            eventType,
          ]);
  };

  const groupedEventTypes = WEBHOOK_EVENT_TYPES.reduce(
    (acc, event) => {
      if (!acc[event.category])
        acc[event.category] = [];
      acc[event.category].push(event);
      return acc;
    },
    {} as Record<string, typeof WEBHOOK_EVENT_TYPES[number][]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhook Subscriptions</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Webhook Name</Label>
                <Input
                  placeholder="e.g., ERP Notifications"
                  value={newWebhookName}
                  onChange={e => setNewWebhookName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used in this session only. The API stores the URL and event types, not a name.
                </p>
              </div>
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  placeholder="https://your-server.com/webhooks"
                  value={newWebhookUrl}
                  onChange={e => setNewWebhookUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Event Types</Label>
                <ScrollArea className="h-48 border rounded-md p-3 mt-1">
                  <div className="space-y-4">
                    {Object.entries(groupedEventTypes).map(([
                      category,
                      events,
                    ]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium mb-2">{category}</h4>
                        <div className="space-y-2 ml-2">
                          {events.map(event => (
                            <div
                              key={event.value}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={event.value}
                                checked={selectedEventTypes.includes(event.value)}
                                onCheckedChange={() => toggleEventType(event.value)}
                              />
                              <label
                                htmlFor={event.value}
                                className="text-sm cursor-pointer"
                              >
                                {event.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                loading={registerWebhook.isPending}
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">
            Subscriptions (
            {subscriptions.length}
            )
          </TabsTrigger>
          <TabsTrigger value="logs">
            Delivery Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="subscriptions"
          className="space-y-4 mt-4"
        >
          {isLoading
            ? (
                <p className="text-muted-foreground">Loading...</p>
              )
            : isError
              ? (
                  <p className="text-sm text-muted-foreground">
                    Couldn't load webhooks.
                    {" "}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  </p>
                )
              : subscriptions.length === 0
                ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No webhook subscriptions configured</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          Create your first webhook
                        </Button>
                      </CardContent>
                    </Card>
                  )
                : (
                    subscriptions.map((subscription) => {
                      const isActive = subscription.status === "active";
                      const secret = revealedSecrets[subscription.id];

                      return (
                        <Card key={subscription.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Webhook className="h-4 w-4" />
                                {/* ponytail: the API stores no webhook name — the URL is
                                    the only human-readable identifier it returns. */}
                                <CardTitle className="text-base">-</CardTitle>
                                <Badge variant={isActive ? "default" : "secondary"}>
                                  {isActive ? "Enabled" : "Paused"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={isActive}
                                  // Only pausing exists; there is no re-enable endpoint.
                                  disabled={!isActive || pauseWebhook.isPending}
                                  title={isActive ? "Pause this webhook" : "Re-enabling is not supported yet"}
                                  onCheckedChange={() => handlePauseWebhook(subscription.id)}
                                />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      disabled={!isActive}
                                    >
                                      <PauseCircle className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Pause Webhook?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This stops deliveries to
                                        {" "}
                                        {subscription.url}
                                        . The console API has no endpoint to re-enable or
                                        delete a webhook, so this cannot be undone here.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground"
                                        onClick={() => handlePauseWebhook(subscription.id)}
                                      >
                                        Pause
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              <code className="text-xs bg-muted px-2 py-1 rounded">{subscription.url}</code>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Signing Secret:</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {secret
                                  ? (showSecrets[subscription.id] ? secret : "••••••••••••")
                                  : "-"}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!secret}
                                title={secret ? "Reveal" : "Shown only once, when the webhook is registered"}
                                onClick={() => setShowSecrets(prev => ({
                                  ...prev, [subscription.id]: !prev[subscription.id],
                                }))}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!secret}
                                title={secret ? "Copy" : "Shown only once, when the webhook is registered"}
                                onClick={() => secret && handleCopySecret(secret)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                // ponytail: no rotate-secret endpoint on /console/webhooks yet.
                                disabled
                                title="Rotating the signing secret is not supported yet"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {subscription.eventTypes.map(event => (
                                <Badge
                                  key={event}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {event}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Created:
                              {" "}
                              {formatDateTime(subscription.createdAt)}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
        </TabsContent>

        <TabsContent
          value="logs"
          className="space-y-4 mt-4"
        >
          {/* ponytail: no delivery-log endpoint on /console yet — nothing to filter
              or list until the server exposes one. */}
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Delivery logs are not available yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                The console API does not expose webhook delivery attempts. Per-event
                delivery history will appear here once it does.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
