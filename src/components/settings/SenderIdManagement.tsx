import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Phone, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useTenantSenderIds, type SenderIdStatus } from "@/hooks/useTenantSenderIds";
import { SenderIdRequestDialog } from "./SenderIdRequestDialog";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<SenderIdStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  whitelisting: { label: "Whitelisting", variant: "outline", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export function SenderIdManagement() {
  const { senderIds, loading } = useTenantSenderIds();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
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
                <MessageSquare className="h-5 w-5 text-primary" />
                Sender ID Management
              </CardTitle>
              <CardDescription>
                Request and manage custom sender IDs for SMS and Voice communications
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Request Sender ID
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {senderIds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No sender IDs configured</p>
              <p className="text-sm mt-1">
                Request a custom sender ID to use for your communications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {senderIds.map((item) => {
                const config = statusConfig[item.status];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {item.sender_type === 'voice' ? (
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-mono font-medium">{item.sender_id}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.sender_type === 'both' ? 'SMS & Voice' : item.sender_type}
                          {' • '}
                          Requested {formatDistanceToNow(new Date(item.requested_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {senderIds.some(s => s.status === 'rejected') && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">Rejected Requests</p>
              {senderIds
                .filter(s => s.status === 'rejected')
                .map(s => (
                  <p key={s.id} className="text-xs text-muted-foreground mt-1">
                    <strong>{s.sender_id}:</strong> {s.rejection_reason || 'No reason provided'}
                  </p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SenderIdRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
