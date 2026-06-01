import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Switch } from '@/components/shadcn/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/shadcn/alert-dialog';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { Webhook, Plus, Copy, RefreshCw, Trash2, Check, X, Clock, AlertTriangle, ExternalLink, Eye } from 'lucide-react';
import { useWebhookSubscriptions, WEBHOOK_EVENT_TYPES, CreateWebhookInput, WebhookDeliveryLog } from '@/hooks/useWebhookSubscriptions';
import { demoWebhookSubscriptions, demoDeliveryLogs } from './demoIntegrationData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function WebhookManagementPanel() {
  const {
    subscriptions: realSubscriptions,
    deliveryLogs: realDeliveryLogs,
    isLoading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    regenerateSecret,
    refreshDeliveryLogs,
  } = useWebhookSubscriptions();
  const subscriptions = realSubscriptions.length > 0 ? realSubscriptions : demoWebhookSubscriptions;
  const deliveryLogs = realDeliveryLogs.length > 0 ? realDeliveryLogs : demoDeliveryLogs;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (selectedEventTypes.length === 0) {
      toast.error('Please select at least one event type');
      return;
    }

    try {
      new URL(newWebhookUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsCreating(true);
    const input: CreateWebhookInput = {
      name: newWebhookName.trim(),
      url: newWebhookUrl.trim(),
      event_types: selectedEventTypes,
    };

    const result = await createSubscription(input);
    setIsCreating(false);

    if (result) {
      setIsCreateDialogOpen(false);
      setNewWebhookName('');
      setNewWebhookUrl('');
      setSelectedEventTypes([]);
    }
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Signing secret copied to clipboard');
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  const groupedEventTypes = WEBHOOK_EVENT_TYPES.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof WEBHOOK_EVENT_TYPES[number][]>);

  const getStatusBadge = (status: WebhookDeliveryLog['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'retrying':
        return <Badge className="bg-yellow-500">Retrying</Badge>;
      case 'dead_letter':
        return <Badge variant="destructive">Dead Letter</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLogs = selectedSubscriptionId
    ? deliveryLogs.filter(log => log.subscription_id === selectedSubscriptionId)
    : deliveryLogs;

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  onChange={(e) => setNewWebhookName(e.target.value)}
                />
              </div>
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  placeholder="https://your-server.com/webhooks"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Event Types</Label>
                <ScrollArea className="h-48 border rounded-md p-3 mt-1">
                  <div className="space-y-4">
                    {Object.entries(groupedEventTypes).map(([category, events]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium mb-2">{category}</h4>
                        <div className="space-y-2 ml-2">
                          {events.map((event) => (
                            <div key={event.value} className="flex items-center gap-2">
                              <Checkbox
                                id={event.value}
                                checked={selectedEventTypes.includes(event.value)}
                                onCheckedChange={() => toggleEventType(event.value)}
                              />
                              <label htmlFor={event.value} className="text-sm cursor-pointer">
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
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs ({deliveryLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No webhook subscriptions configured</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  Create your first webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      <CardTitle className="text-base">{subscription.name}</CardTitle>
                      <Badge variant={subscription.is_enabled ? 'default' : 'secondary'}>
                        {subscription.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={subscription.is_enabled}
                        onCheckedChange={(checked) => updateSubscription(subscription.id, { is_enabled: checked })}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the webhook "{subscription.name}" and all its delivery logs.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => deleteSubscription(subscription.id)}
                            >
                              Delete
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
                      {showSecrets[subscription.id] ? subscription.signing_secret : '••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowSecrets(prev => ({ ...prev, [subscription.id]: !prev[subscription.id] }))}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopySecret(subscription.signing_secret)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => regenerateSecret(subscription.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {subscription.event_types.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(subscription.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Label>Filter by subscription:</Label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedSubscriptionId || ''}
              onChange={(e) => setSelectedSubscriptionId(e.target.value || null)}
            >
              <option value="">All subscriptions</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No delivery logs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.request_url.slice(0, 50)}...
                      </code>
                      <span className="text-xs text-muted-foreground">
                        Attempt {log.attempt_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {log.response_status_code && (
                        <Badge variant="outline">{log.response_status_code}</Badge>
                      )}
                      {log.duration_ms && (
                        <span>{log.duration_ms}ms</span>
                      )}
                      <span>{format(new Date(log.created_at), 'MMM d HH:mm:ss')}</span>
                    </div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {log.error_message}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
