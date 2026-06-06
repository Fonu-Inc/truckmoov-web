import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Switch } from '@/components/shadcn/switch';
import { Separator } from '@/components/shadcn/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/shadcn/dialog';
import {
  Link2, Unlink, RefreshCw, CheckCircle2, XCircle, Clock, Plus,
  Trash2, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Play,
  Settings2, Database, Layers, CalendarClock, AlertTriangle,
} from 'lucide-react';
import { useERPIntegration, ERP_PROVIDERS, type ERPConnector } from '@/hooks/useERPIntegration';
import { toast } from 'sonner';
import { format } from 'date-fns';
type ERPProvider = string;
type ERPAuthMethod = string;
type ERPSyncScope = string;

interface Props {
  tenantId: string;
}

const SCOPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  orders: { label: 'Orders & Shipments', icon: <Layers className="h-4 w-4" /> },
  invoices: { label: 'Invoices & Billing', icon: <ArrowUpRight className="h-4 w-4" /> },
  inventory: { label: 'Inventory & Warehouse', icon: <Database className="h-4 w-4" /> },
  fleet_costs: { label: 'Fleet Costs & Assets', icon: <Settings2 className="h-4 w-4" /> },
};

export function ERPWMSIntegrationPanel({ tenantId }: Props) {
  const {
    connectors: realConnectors, mappings, syncLogs, schedules,
    isLoading, isSyncing,
    fetchConnectors, createConnector, deleteConnector, testConnection,
    fetchMappings, addMapping, deleteMapping, loadDefaultMappings,
    executeSync, fetchSyncLogs, fetchSchedules, upsertSchedule,
  } = useERPIntegration(tenantId);
  const connectors = realConnectors;

  const [selectedConnector, setSelectedConnector] = useState<ERPConnector | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newConnector, setNewConnector] = useState({
    name: '', provider: 'sap' as ERPProvider, auth_method: 'api_key' as ERPAuthMethod,
    api_base_url: '', company_name: '',
  });

  useEffect(() => { fetchConnectors(); }, [fetchConnectors]);

  useEffect(() => {
    if (selectedConnector) {
      fetchMappings(selectedConnector.id);
      fetchSyncLogs(selectedConnector.id);
      fetchSchedules(selectedConnector.id);
    }
  }, [selectedConnector, fetchMappings, fetchSyncLogs, fetchSchedules]);

  const handleCreate = async () => {
    const result = await createConnector(newConnector);
    if (result) {
      setShowAddDialog(false);
      setNewConnector({ name: '', provider: 'sap', auth_method: 'api_key', api_base_url: '', company_name: '' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-emerald-600">Success</Badge>;
      case 'partial': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Partial</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connectors List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              ERP & WMS Connectors
            </CardTitle>
            <CardDescription>
              Connect your enterprise systems for seamless data synchronization
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Connector</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add ERP/WMS Connector</DialogTitle>
                <DialogDescription>
                  Select a platform and configure the connection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Select value={newConnector.provider} onValueChange={(v) => setNewConnector(p => ({ ...p, provider: v as ERPProvider }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ERP_PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Connection Name</Label>
                  <Input value={newConnector.name} onChange={e => setNewConnector(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Production SAP" />
                </div>
                <div>
                  <Label>Auth Method</Label>
                  <Select value={newConnector.auth_method} onValueChange={(v) => setNewConnector(p => ({ ...p, auth_method: v as ERPAuthMethod }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="basic_auth">Basic Auth</SelectItem>
                      <SelectItem value="custom_header">Custom Header</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Base URL</Label>
                  <Input value={newConnector.api_base_url} onChange={e => setNewConnector(p => ({ ...p, api_base_url: e.target.value }))}
                    placeholder="https://api.example.com/v1" />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={newConnector.company_name} onChange={e => setNewConnector(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Your ERP company name" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newConnector.name}>Create Connector</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />Loading connectors...
            </div>
          ) : connectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No ERP/WMS connectors configured yet.</p>
              <p className="text-xs mt-1">Add a connector to start syncing data with your enterprise systems.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectors.map(conn => {
                const provider = ERP_PROVIDERS.find(p => p.id === conn.provider);
                return (
                  <div key={conn.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedConnector?.id === conn.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedConnector(conn)}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider?.icon || '⚙️'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conn.name}</span>
                          {getStatusBadge(conn.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {provider?.name}{conn.company_name ? ` · ${conn.company_name}` : ''}
                          {conn.last_sync_at && ` · Last sync: ${format(new Date(conn.last_sync_at), 'MMM d, HH:mm')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); testConnection(conn.id); }}
                        disabled={isSyncing}>
                        <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />Test
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteConnector(conn.id); }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Connector Detail */}
      {selectedConnector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {selectedConnector.name} — Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mappings">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mappings">Data Mapping</TabsTrigger>
                <TabsTrigger value="sync">Sync Dashboard</TabsTrigger>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
              </TabsList>

              {/* Data Mapping Tab */}
              <TabsContent value="mappings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Map FleetPro fields to your {ERP_PROVIDERS.find(p => p.id === selectedConnector.provider)?.name} fields
                  </p>
                  <Button size="sm" variant="outline"
                    onClick={() => loadDefaultMappings(selectedConnector.id, selectedConnector.provider)}>
                    <ArrowLeftRight className="h-3 w-3 mr-1" />Load Defaults
                  </Button>
                </div>

                {Object.entries(SCOPE_LABELS).map(([scope, { label, icon }]) => {
                  const scopeMappings = mappings.filter(m => m.scope === scope);
                  return (
                    <div key={scope} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          {icon} {label}
                        </div>
                        <Badge variant="outline">{scopeMappings.length} mappings</Badge>
                      </div>
                      {scopeMappings.length > 0 && (
                        <div className="space-y-2">
                          {scopeMappings.map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-background px-1.5 py-0.5 rounded">{m.fleetpro_entity}.{m.fleetpro_field}</code>
                                <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                                <code className="text-xs bg-background px-1.5 py-0.5 rounded">{m.erp_entity}.{m.erp_field}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {m.direction === 'inbound' ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : m.direction === 'outbound' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowLeftRight className="h-3 w-3 mr-1" />}
                                  {m.direction}
                                </Badge>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                                  onClick={() => deleteMapping(m.id, selectedConnector.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              {/* Sync Dashboard Tab */}
              <TabsContent value="sync" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(SCOPE_LABELS) as ERPSyncScope[]).map(scope => (
                    <Button key={scope} variant="outline" className="h-auto flex-col py-3 gap-1"
                      onClick={() => executeSync(selectedConnector.id, scope)} disabled={isSyncing}>
                      {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      <span className="text-xs">Sync {SCOPE_LABELS[scope].label}</span>
                    </Button>
                  ))}
                </div>

                <Separator />

                <h4 className="text-sm font-medium">Sync History</h4>
                <ScrollArea className="h-64">
                  {syncLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No sync history yet</p>
                  ) : (
                    <div className="space-y-2">
                      {syncLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{SCOPE_LABELS[log.scope]?.label || log.scope}</span>
                              {getSyncStatusBadge(log.status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {log.records_processed} records · {log.records_succeeded} ok · {log.records_failed} failed
                              {log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />{log.error_message}
                              </p>
                            )}
                          </div>
                          {log.completed_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.completed_at), 'MMM d, HH:mm')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Schedules Tab */}
              <TabsContent value="schedules" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure automated sync intervals for each data scope
                </p>
                <div className="space-y-3">
                  {(Object.keys(SCOPE_LABELS) as ERPSyncScope[]).map(scope => {
                    const schedule = schedules.find(s => s.scope === scope);
                    return (
                      <div key={scope} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {SCOPE_LABELS[scope].icon}
                          <div>
                            <p className="font-medium text-sm">{SCOPE_LABELS[scope].label}</p>
                            {schedule?.last_run_at && (
                              <p className="text-xs text-muted-foreground">
                                Last: {format(new Date(schedule.last_run_at), 'MMM d, HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select
                            value={String(schedule?.interval_minutes || 60)}
                            onValueChange={(v) => upsertSchedule({
                              connector_id: selectedConnector.id,
                              scope,
                              direction: 'bidirectional',
                              interval_minutes: Number(v),
                              is_active: schedule?.is_active ?? true,
                            })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">Every 15 min</SelectItem>
                              <SelectItem value="30">Every 30 min</SelectItem>
                              <SelectItem value="60">Hourly</SelectItem>
                              <SelectItem value="360">Every 6 hours</SelectItem>
                              <SelectItem value="1440">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={schedule?.is_active ?? false}
                            onCheckedChange={(checked) => upsertSchedule({
                              connector_id: selectedConnector.id,
                              scope,
                              direction: 'bidirectional',
                              interval_minutes: schedule?.interval_minutes || 60,
                              is_active: checked,
                            })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



