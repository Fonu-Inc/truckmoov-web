import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DeviceLifecycleBadge } from '@/components/devices/DeviceLifecycleBadge';
import { DeviceSetupWizard } from './DeviceSetupWizard';
import { ConfigQueueDevice } from '@/hooks/useInstallerConfig';
import { DeviceCatalogEntry } from '@/hooks/useDeviceCatalog';
import { DeviceLifecycleStatus } from '@/hooks/useDeviceLifecycle';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Settings,
  CheckCircle2,
  Radio,
  ArrowRight,
  AlertTriangle,
  Filter,
  Cpu,
} from 'lucide-react';

interface ConfigQueueProps {
  devices: ConfigQueueDevice[];
  catalog: DeviceCatalogEntry[];
  loading: boolean;
  onRefresh: () => void;
  onMarkConfigured: (deviceId: string, notes?: string) => Promise<{ success: boolean }>;
  onReset: (deviceId: string, reason: string) => Promise<{ success: boolean }>;
  onTroubleshoot: (deviceId: string) => void;
  canConfigure: boolean;
  canReset: boolean;
}

export function ConfigQueue({
  devices,
  catalog,
  loading,
  onRefresh,
  onMarkConfigured,
  onReset,
  onTroubleshoot,
  canConfigure,
  canReset,
}: ConfigQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<ConfigQueueDevice | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const manufacturers = [...new Set(devices.map(d => d.manufacturer))];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.model?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || device.lifecycle_status === statusFilter;
    const matchesManufacturer = manufacturerFilter === 'all' || device.manufacturer === manufacturerFilter;
    
    return matchesSearch && matchesStatus && matchesManufacturer;
  });

  const getCatalogEntry = (device: ConfigQueueDevice) => {
    return catalog.find(c => 
      c.manufacturer.toLowerCase() === device.manufacturer.toLowerCase() &&
      c.model.toLowerCase() === (device.model || '').toLowerCase()
    );
  };

  const getNextAction = (device: ConfigQueueDevice) => {
    const status = device.lifecycle_status as DeviceLifecycleStatus;
    switch (status) {
      case 'registered':
      case 'config_pending':
        return { label: 'Setup Guide', icon: Settings, action: 'setup' };
      case 'configured':
        return { label: 'Verify Signal', icon: Radio, action: 'verify' };
      case 'verified_online':
      case 'assignable':
        return { label: 'Ready to Assign', icon: ArrowRight, action: 'assign' };
      default:
        return null;
    }
  };

  const handleOpenWizard = (device: ConfigQueueDevice) => {
    setSelectedDevice(device);
    setWizardOpen(true);
  };

  const handleWizardComplete = async () => {
    setWizardOpen(false);
    setSelectedDevice(null);
    onRefresh();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Configuration Queue
              </CardTitle>
              <CardDescription>
                Devices awaiting configuration and verification
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by IMEI, manufacturer, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="config_pending">Config Pending</SelectItem>
                <SelectItem value="configured">Configured</SelectItem>
                <SelectItem value="verified_online">Verified Online</SelectItem>
                <SelectItem value="assignable">Assignable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { status: 'registered', label: 'Registered', count: devices.filter(d => d.lifecycle_status === 'registered').length },
              { status: 'config_pending', label: 'Config Pending', count: devices.filter(d => d.lifecycle_status === 'config_pending').length },
              { status: 'configured', label: 'Configured', count: devices.filter(d => d.lifecycle_status === 'configured').length },
              { status: 'verified_online', label: 'Verified', count: devices.filter(d => d.lifecycle_status === 'verified_online').length },
              { status: 'assignable', label: 'Assignable', count: devices.filter(d => d.lifecycle_status === 'assignable').length },
            ].map(stat => (
              <button
                key={stat.status}
                onClick={() => setStatusFilter(stat.status)}
                className={`rounded-lg border p-3 text-left transition-colors hover:border-primary/50 ${
                  statusFilter === stat.status ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Device Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Protocol / Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {devices.length === 0 
                        ? "No devices in configuration pipeline"
                        : "No devices match your filters"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map(device => {
                    const catalogEntry = getCatalogEntry(device);
                    const nextAction = getNextAction(device);
                    
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{device.manufacturer}</p>
                            <p className="text-xs text-muted-foreground">{device.model || 'Unknown Model'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="uppercase text-xs">
                              {catalogEntry?.protocol_type || device.protocol || 'HTTP'}
                            </Badge>
                            {catalogEntry?.default_port && (
                              <span className="text-xs text-muted-foreground">
                                :{catalogEntry.default_port}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DeviceLifecycleBadge status={device.lifecycle_status as DeviceLifecycleStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {device.last_seen 
                            ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          {nextAction && canConfigure && (
                            <Button
                              size="sm"
                              variant={nextAction.action === 'setup' ? 'default' : 'outline-solid'}
                              onClick={() => handleOpenWizard(device)}
                            >
                              <nextAction.icon className="h-4 w-4 mr-2" />
                              {nextAction.label}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenWizard(device)}>
                                <Settings className="h-4 w-4 mr-2" />
                                View Setup Guide
                              </DropdownMenuItem>
                              {canConfigure && device.lifecycle_status !== 'configured' && (
                                <DropdownMenuItem onClick={() => onMarkConfigured(device.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Configured
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onTroubleshoot(device.id)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Troubleshoot
                              </DropdownMenuItem>
                              {canReset && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => onReset(device.id, 'Manual reset by admin')}
                                    className="text-destructive"
                                  >
                                    Reset to Config Pending
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Device Setup Wizard */}
      {selectedDevice && (
        <DeviceSetupWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          device={selectedDevice}
          catalogEntry={getCatalogEntry(selectedDevice)}
          onMarkConfigured={onMarkConfigured}
          onComplete={handleWizardComplete}
          canConfigure={canConfigure}
        />
      )}
    </>
  );
}
