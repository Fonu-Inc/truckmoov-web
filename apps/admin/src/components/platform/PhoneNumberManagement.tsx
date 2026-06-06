import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Badge } from '@/components/shadcn/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Textarea } from '@/components/shadcn/textarea';
import { Phone, Plus, MoreHorizontal, Building2, PhoneOff, Trash2, RefreshCw, MessageSquare, PhoneCall, Search, Loader2 } from 'lucide-react';
import { usePlatformPhoneNumbers, PlatformPhoneNumber } from '@/hooks/usePlatformPhoneNumbers';
import { useTenants } from '@/hooks/useTenants';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { ExportButton } from '@/components/shadcn/export-button';
import { TableToolbar } from '@/components/shadcn/table-toolbar';

interface AvailableNumber {
  phone_number: string;
  phone_number_type: 'local' | 'mobile' | 'toll_free';
  monthly_cost_ngn: number;
  capabilities: string[];
}

export function PhoneNumberManagement() {
  const { phoneNumbers, loading, provisionNumber, assignToTenant, unassignFromTenant, suspendNumber, releaseNumber, deleteNumber, refetch } = usePlatformPhoneNumbers();
  const { tenants } = useTenants();
  const { user } = useAuthStore();
  
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PlatformPhoneNumber | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Available numbers from provider (Fonu)
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Provision form state
  const [newNumber, setNewNumber] = useState('');
  const [numberType, setNumberType] = useState<'local' | 'mobile' | 'toll_free'>('mobile');
  const [capabilities, setCapabilities] = useState<string[]>(['sms', 'voice']);
  const [monthlyCost, setMonthlyCost] = useState('');
  const [notes, setNotes] = useState('');

  // Assign form state
  const [selectedTenantId, setSelectedTenantId] = useState('');

  // Fetch available numbers when dialog opens
  const fetchAvailableNumbers = async () => {
    setLoadingAvailable(true);
    setAvailableNumbers([
      { phone_number: '+234 801 000 0001', phone_number_type: 'mobile', monthly_cost_ngn: 5000, capabilities: ['sms', 'voice'] },
      { phone_number: '+234 801 000 0002', phone_number_type: 'mobile', monthly_cost_ngn: 5000, capabilities: ['sms', 'voice'] },
      { phone_number: '+234 801 000 0003', phone_number_type: 'mobile', monthly_cost_ngn: 5000, capabilities: ['sms', 'voice'] },
      { phone_number: '+234 802 000 0001', phone_number_type: 'mobile', monthly_cost_ngn: 4500, capabilities: ['sms', 'voice'] },
      { phone_number: '+234 802 000 0002', phone_number_type: 'mobile', monthly_cost_ngn: 4500, capabilities: ['sms', 'voice'] },
      { phone_number: '+234 700 000 0001', phone_number_type: 'toll_free', monthly_cost_ngn: 15000, capabilities: ['voice'] },
      { phone_number: '+234 1 000 0001', phone_number_type: 'local', monthly_cost_ngn: 3000, capabilities: ['sms', 'voice'] },
    ]);
    setLoadingAvailable(false);
  };

  // When a number is selected from dropdown, auto-fill other fields
  const handleNumberSelect = (phoneNumber: string) => {
    setNewNumber(phoneNumber);
    const selected = availableNumbers.find(n => n.phone_number === phoneNumber);
    if (selected) {
      setNumberType(selected.phone_number_type);
      setCapabilities(selected.capabilities);
      setMonthlyCost(selected.monthly_cost_ngn.toString());
    }
  };

  useEffect(() => {
    if (isProvisionDialogOpen) {
      fetchAvailableNumbers();
    }
  }, [isProvisionDialogOpen]);

  const handleProvision = async () => {
    if (!newNumber.trim()) return;
    
    await provisionNumber({
      phone_number: newNumber.trim(),
      phone_number_type: numberType,
      capabilities,
      monthly_cost_ngn: monthlyCost ? parseFloat(monthlyCost) : 0,
      notes: notes || undefined,
    });
    
    setIsProvisionDialogOpen(false);
    resetProvisionForm();
  };

  const handleAssign = async () => {
    if (!selectedNumber || !selectedTenantId) return;
    
    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) return;
    
    await assignToTenant(
      selectedNumber.id,
      selectedTenantId,
      tenant.name,
      user?.name || 'Platform Admin'
    );
    
    setIsAssignDialogOpen(false);
    setSelectedNumber(null);
    setSelectedTenantId('');
  };

  const resetProvisionForm = () => {
    setNewNumber('');
    setNumberType('mobile');
    setCapabilities(['sms', 'voice']);
    setMonthlyCost('');
    setNotes('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'secondary',
      assigned: 'default',
      suspended: 'destructive',
      released: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const filteredNumbers = phoneNumbers.filter(num => {
    const matchesStatus = filterStatus === 'all' || num.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      num.phone_number.includes(searchQuery) ||
      num.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: phoneNumbers.length,
    available: phoneNumbers.filter(n => n.status === 'available').length,
    assigned: phoneNumbers.filter(n => n.status === 'assigned').length,
    suspended: phoneNumbers.filter(n => n.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Number Inventory
              </CardTitle>
              <CardDescription>
                Provision and assign phone numbers to tenants for SMS and Voice
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <ExportButton
                filename="phone-numbers"
                rows={filteredNumbers}
                columns={[
                  { header: "Phone Number", accessor: (n) => n.phone_number },
                  { header: "Type", accessor: (n) => n.phone_number_type },
                  { header: "Capabilities", accessor: (n) => n.capabilities.join('; ') },
                  { header: "Status", accessor: (n) => n.status },
                  { header: "Assigned To", accessor: (n) => n.tenant_name || "" },
                  { header: "Monthly Cost (NGN)", accessor: (n) => n.monthly_cost_ngn || 0 },
                ]}
              />
              <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Provision Number
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Provision New Phone Number</DialogTitle>
                    <DialogDescription>
                      Add a new phone number to the platform inventory
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Phone Number</Label>
                      {loadingAvailable ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading available numbers...</span>
                        </div>
                      ) : (
                        <Select value={newNumber} onValueChange={handleNumberSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an available number..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {availableNumbers.length === 0 ? (
                              <div className="py-4 px-2 text-center text-sm text-muted-foreground">
                                No available numbers
                              </div>
                            ) : (
                              availableNumbers.map((num) => (
                                <SelectItem 
                                  key={num.phone_number} 
                                  value={num.phone_number}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span className="font-mono">{num.phone_number}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {num.phone_number_type.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        ₦{num.monthly_cost_ngn.toLocaleString()}/mo
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {newNumber && (
                      <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                        <p><strong>Selected:</strong> <span className="font-mono">{newNumber}</span></p>
                        <p><strong>Type:</strong> <span className="capitalize">{numberType.replace('_', ' ')}</span></p>
                        <p><strong>Capabilities:</strong> {capabilities.join(', ').toUpperCase()}</p>
                        <p><strong>Monthly Cost:</strong> ₦{parseFloat(monthlyCost || '0').toLocaleString()}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this number..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleProvision} disabled={!newNumber.trim()}>
                      Provision
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4">
            <TableToolbar
              search={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by number or tenant..."
              status={filterStatus}
              onStatusChange={setFilterStatus}
              statusOptions={[
                { value: 'available', label: 'Available' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'released', label: 'Released' },
              ]}
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Monthly Cost</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No phone numbers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNumbers.map((num) => (
                    <TableRow key={num.id}>
                      <TableCell className="font-mono font-medium">{num.phone_number}</TableCell>
                      <TableCell className="capitalize">{num.phone_number_type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {num.capabilities.includes('sms') && (
                            <Badge variant="outline" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Badge>
                          )}
                          {num.capabilities.includes('voice') && (
                            <Badge variant="outline" className="text-xs">
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Voice
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(num.status)}</TableCell>
                      <TableCell>
                        {num.tenant_name ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{num.tenant_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>₦{num.monthly_cost_ngn?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {num.status === 'available' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedNumber(num);
                                setIsAssignDialogOpen(true);
                              }}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Assign to Tenant
                              </DropdownMenuItem>
                            )}
                            {num.status === 'assigned' && (
                              <>
                                <DropdownMenuItem onClick={() => unassignFromTenant(num.id)}>
                                  <PhoneOff className="h-4 w-4 mr-2" />
                                  Unassign
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => suspendNumber(num.id)}
                                  className="text-destructive"
                                >
                                  <PhoneOff className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              </>
                            )}
                            {num.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => releaseNumber(num.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Release
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteNumber(num.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Phone Number to Tenant</DialogTitle>
            <DialogDescription>
              Assign {selectedNumber?.phone_number} to a tenant for SMS and Voice communications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Tenant</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants
                    .filter(t => t.status === 'active')
                    .map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedNumber && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Number:</strong> {selectedNumber.phone_number}</p>
                <p><strong>Type:</strong> {selectedNumber.phone_number_type}</p>
                <p><strong>Capabilities:</strong> {selectedNumber.capabilities.join(', ')}</p>
                <p><strong>Monthly Cost:</strong> ₦{selectedNumber.monthly_cost_ngn?.toLocaleString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedTenantId}>
              Assign Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



