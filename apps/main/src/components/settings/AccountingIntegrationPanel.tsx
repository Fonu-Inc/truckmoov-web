import { formatDate, formatDateTime, formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Separator } from '@/components/shadcn/separator';
import { 
  Link2, 
  Unlink, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileText,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
type InvoiceSync = any;

export function AccountingIntegrationPanel() {
  const integration: any = null;
  const invoiceSyncs: InvoiceSync[] = [];
  const isLoading = false;
  const isConnecting = false;
  const fetchIntegration = async () => {};
  const connectSage = async () => {};
  const disconnectSage = async () => {};
  const fetchInvoiceSyncs = async () => {};

  useEffect(() => {
    fetchIntegration();
    fetchInvoiceSyncs();
  }, [fetchIntegration, fetchInvoiceSyncs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary"><Unlink className="h-3 w-3 mr-1" />Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getSyncStatusBadge = (sync: InvoiceSync) => {
    switch (sync.sync_status) {
      case 'synced':
        return <Badge variant="default" className="bg-emerald-600">Synced</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'syncing':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sage Accounting
          </CardTitle>
          <CardDescription>
            Sync job revenue and invoices with your Sage accounting software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : integration?.status === 'connected' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration.status)}
                    {integration.company_name && (
                      <span className="text-sm text-muted-foreground">
                        · {integration.company_name}
                      </span>
                    )}
                  </div>
                  {integration.connected_at && (
                    <p className="text-xs text-muted-foreground">
                      Connected {formatDate(integration.connected_at)}
                    </p>
                  )}
                  {integration.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {formatDateTime(integration.last_sync_at)}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={disconnectSage}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {integration.sync_error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Sync Error</p>
                    <p className="text-xs text-muted-foreground">{integration.sync_error}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Sage accounting account to automatically sync job revenue as invoices.
              </p>
              <Button onClick={connectSage} disabled={isConnecting}>
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Connect Sage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {integration?.status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Sync History
            </CardTitle>
            <CardDescription>
              Track the sync status of job invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoiceSyncs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No invoices synced yet. Complete a job to create an invoice.
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {invoiceSyncs.map((sync) => (
                    <div
                      key={sync.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {sync.external_invoice_number || `Job ${sync.job_id.substring(0, 8)}`}
                          </span>
                          {getSyncStatusBadge(sync)}
                          <Badge variant="outline" className="text-xs">
                            {sync.sync_direction === 'outbound' ? (
                              <><ArrowUpRight className="h-3 w-3 mr-1" />Outbound</>
                            ) : (
                              'Inbound'
                            )}
                          </Badge>
                        </div>
                        {sync.amount_ngn && (
                          <p className="text-xs text-muted-foreground">
                            ₦{sync.amount_ngn.toLocaleString()}
                          </p>
                        )}
                        {sync.error_message && (
                          <p className="text-xs text-destructive">{sync.error_message}</p>
                        )}
                      </div>
                      {sync.synced_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDayMonthTime(sync.synced_at)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
