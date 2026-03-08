import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Wallet, 
  Plus, 
  RefreshCw, 
  Building2, 
  CreditCard,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenantWallet {
  id: string;
  tenant_id: string;
  balance_ngn: number;
  credit_enabled: boolean;
  credit_limit_ngn: number;
  low_balance_threshold_ngn: number;
  updated_at: string;
}

export function TenantWalletManagement() {
  const [wallets, setWallets] = useState<TenantWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<TenantWallet | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenant_wallets')
      .select('*')
      .order('balance_ngn', { ascending: true });

    if (error) {
      toast.error('Failed to load wallets');
      console.error(error);
    } else {
      setWallets(data || []);
    }
    setLoading(false);
  };

  const handleTopup = async () => {
    if (!selectedWallet || !topupAmount) return;
    
    setTopupLoading(true);
    
    const { data, error } = await supabase.rpc('topup_wallet', {
      p_tenant_id: selectedWallet.tenant_id,
      p_amount: parseFloat(topupAmount),
      p_description: 'Manual top-up by platform admin'
    });

    if (error) {
      toast.error('Failed to top up wallet');
      console.error(error);
    } else if (data && typeof data === 'object' && 'success' in data && data.success) {
      toast.success(`Successfully added ₦${parseFloat(topupAmount).toLocaleString()} to wallet`);
      setTopupDialogOpen(false);
      setTopupAmount('');
      setSelectedWallet(null);
      fetchWallets();
    } else {
      toast.error('Top-up failed');
    }
    
    setTopupLoading(false);
  };

  const handleToggleCredit = async (wallet: TenantWallet) => {
    const { error } = await supabase
      .from('tenant_wallets')
      .update({ credit_enabled: !wallet.credit_enabled })
      .eq('id', wallet.id);

    if (error) {
      toast.error('Failed to update credit status');
    } else {
      toast.success(`Credit ${wallet.credit_enabled ? 'disabled' : 'enabled'} for tenant`);
      fetchWallets();
    }
  };

  const getBalanceStatus = (wallet: TenantWallet) => {
    if (wallet.balance_ngn < 0) {
      return { color: 'destructive', text: 'Negative' };
    }
    if (wallet.balance_ngn < wallet.low_balance_threshold_ngn) {
      return { color: 'warning', text: 'Low' };
    }
    return { color: 'default', text: 'Healthy' };
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance_ngn || 0), 0);
  const lowBalanceCount = wallets.filter(w => w.balance_ngn < w.low_balance_threshold_ngn).length;
  const negativeBalanceCount = wallets.filter(w => w.balance_ngn < 0).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground">Active tenant wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{lowBalanceCount}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Negative Balance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{negativeBalanceCount}</div>
            <p className="text-xs text-muted-foreground">Using credit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Tenant Wallets
              </CardTitle>
              <CardDescription>
                Manage wallet balances and credit settings for all tenants
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchWallets}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credit Enabled</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Low Balance Threshold</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tenant wallets found
                  </TableCell>
                </TableRow>
              ) : (
                wallets.map((wallet) => {
                  const status = getBalanceStatus(wallet);
                  return (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">{wallet.tenant_id}</TableCell>
                      <TableCell className={wallet.balance_ngn < 0 ? 'text-destructive' : ''}>
                        ₦{wallet.balance_ngn.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color as "default" | "destructive" | "outline" | "secondary"}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={wallet.credit_enabled}
                          onCheckedChange={() => handleToggleCredit(wallet)}
                        />
                      </TableCell>
                      <TableCell>₦{wallet.credit_limit_ngn.toLocaleString()}</TableCell>
                      <TableCell>₦{wallet.low_balance_threshold_ngn.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setTopupDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Top Up
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Add funds to {selectedWallet?.tenant_id}'s wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold">
                ₦{selectedWallet?.balance_ngn.toLocaleString() || 0}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Top Up Amount (₦)</Label>
              <Input
                id="topup-amount"
                type="number"
                min="0"
                placeholder="Enter amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>

            {topupAmount && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">New Balance</p>
                <p className="text-lg font-semibold">
                  ₦{((selectedWallet?.balance_ngn || 0) + parseFloat(topupAmount || '0')).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopup} disabled={topupLoading || !topupAmount}>
              {topupLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Confirm Top Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
