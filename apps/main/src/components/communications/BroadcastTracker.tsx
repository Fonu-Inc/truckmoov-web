import type { ColumnDef } from "@tanstack/react-table";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Eye,
  Loader2,
  Megaphone,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/shadcn/radio-group";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Textarea } from "@/components/shadcn/textarea";
import { mockDrivers } from "@/data/mockData";

const statusConfig: Record<string, {
  icon: React.ElementType; color: string; label: string;
}> = {
  pending: {
    icon: Clock, color: "text-muted-foreground", label: "Pending",
  },
  sent: {
    icon: Check, color: "text-info", label: "Sent",
  },
  delivered: {
    icon: CheckCheck, color: "text-success", label: "Delivered",
  },
  read: {
    icon: Eye, color: "text-primary", label: "Read",
  },
  replied: {
    icon: MessageCircle, color: "text-success", label: "Replied",
  },
  failed: {
    icon: X, color: "text-destructive", label: "Failed",
  },
};

type BroadcastRecipient = {
  id: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  status: string;
  reply_content?: string | null;
};

export function BroadcastTracker() {
  const [
    broadcastMessage,
    setBroadcastMessage,
  ] = useState("");
  const [
    broadcastChannel,
    setBroadcastChannel,
  ] = useState<"whatsapp" | "sms">("whatsapp");
  const [
    showReplyDialog,
    setShowReplyDialog,
  ] = useState(false);
  const [
    selectedReply,
    setSelectedReply,
  ] = useState<{
    name: string; content: string;
  } | null>(null);

  const broadcasts: any[] = [];
  const selectedBroadcast: any = null;
  const recipients: any[] = [];
  const isLoading = false;
  const isSending = false;
  const sendBroadcast = async (..._args: any[]) => ({ success: false });
  const selectBroadcast = (_broadcast: any) => {};
  const clearSelection = () => {};

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim())
      return;

    const drivers = mockDrivers.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      status: d.status,
    }));

    const result = await sendBroadcast(
      drivers,
      broadcastMessage,
      broadcastChannel,
      "Supervisor",
    );
    if (result.success) {
      setBroadcastMessage("");
    }
  };

  const activeDriverCount = mockDrivers.filter(d => d.status !== "offline").length;

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={`gap-1 ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const recipientColumns: ColumnDef<BroadcastRecipient>[] = [
    {
      accessorKey: "driver_name",
      header: "Driver",
      meta: { className: "font-medium" },
    },
    {
      accessorKey: "driver_phone",
      header: "Phone",
      meta: { className: "text-muted-foreground" },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "reply",
      header: "Reply",
      enableSorting: false,
      cell: ({ row }) => {
        const recipient = row.original;
        if (!recipient.reply_content)
          return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedReply({
                name: recipient.driver_name || "Driver",
                content: recipient.reply_content || "",
              });
              setShowReplyDialog(true);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            View
          </Button>
        );
      },
    },
  ];

  if (selectedBroadcast) {
    const deliveryRate = selectedBroadcast.total_recipients > 0
      ? (selectedBroadcast.delivered_count / selectedBroadcast.total_recipients) * 100
      : 0;
    const readRate = selectedBroadcast.total_recipients > 0
      ? (selectedBroadcast.read_count / selectedBroadcast.total_recipients) * 100
      : 0;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelection}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-lg">Broadcast Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatWithPattern(
                  selectedBroadcast.created_at,
                  "PPp",
                )}
              </p>
            </div>
            <Badge variant="secondary">{selectedBroadcast.channel.toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Preview */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">{selectedBroadcast.message}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{selectedBroadcast.total_recipients}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info">{selectedBroadcast.delivered_count}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{selectedBroadcast.read_count}</p>
              <p className="text-xs text-muted-foreground">Read</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{selectedBroadcast.replied_count}</p>
              <p className="text-xs text-muted-foreground">Replied</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Delivery Rate</span>
                <span>
                  {deliveryRate.toFixed(0)}
                  %
                </span>
              </div>
              <Progress
                value={deliveryRate}
                className="h-2"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Read Rate</span>
                <span>
                  {readRate.toFixed(0)}
                  %
                </span>
              </div>
              <Progress
                value={readRate}
                className="h-2"
              />
            </div>
          </div>

          {/* Recipients Table */}
          <div>
            <h4 className="font-medium mb-3">
              Recipients (
              {recipients.length}
              )
            </h4>
            <ScrollArea className="h-[300px] rounded-md border">
              <DataTable
                columns={recipientColumns}
                data={recipients}
                emptyState="No recipients"
              />
            </ScrollArea>
          </div>
        </CardContent>

        {/* Reply Dialog */}
        <Dialog
          open={showReplyDialog}
          onOpenChange={setShowReplyDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Reply from
                {selectedReply?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">{selectedReply?.content}</p>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Send Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a message to all active drivers (
            {activeDriverCount}
            {" "}
            active)
          </p>
          <RadioGroup
            value={broadcastChannel}
            onValueChange={v => setBroadcastChannel(v as "whatsapp" | "sms")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="whatsapp"
                id="bc-whatsapp"
              />
              <Label
                htmlFor="bc-whatsapp"
                className="text-sm"
              >
                WhatsApp
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="sms"
                id="bc-sms"
              />
              <Label
                htmlFor="bc-sms"
                className="text-sm"
              >
                SMS
              </Label>
            </div>
          </RadioGroup>
          <Textarea
            placeholder="Type your broadcast message..."
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            rows={3}
          />
          <Button
            className="w-full gap-2"
            onClick={handleSendBroadcast}
            disabled={isSending || !broadcastMessage.trim()}
          >
            {isSending
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : (
                  <Send className="h-4 w-4" />
                )}
            {isSending ? "Sending..." : "Send Broadcast"}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : broadcasts.length === 0
              ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No broadcasts sent yet</p>
                  </div>
                )
              : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {broadcasts.map(broadcast => (
                        <div
                          key={broadcast.id}
                          className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => selectBroadcast(broadcast)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{broadcast.channel.toUpperCase()}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatWithPattern(
                                  broadcast.created_at,
                                  "PPp",
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-info">
                                {broadcast.delivered_count}
                                {" "}
                                sent
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-primary">
                                {broadcast.read_count}
                                {" "}
                                read
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-success">
                                {broadcast.replied_count}
                                {" "}
                                replied
                              </span>
                            </div>
                          </div>
                          <p className="text-sm line-clamp-2">{broadcast.message}</p>
                          <div className="mt-2">
                            <Progress
                              value={(broadcast.delivered_count / broadcast.total_recipients) * 100}
                              className="h-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
        </CardContent>
      </Card>
    </div>
  );
}
