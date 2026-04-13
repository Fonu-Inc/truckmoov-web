import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  TrendingUp,
  Zap,
  BarChart3,
  Mic,
  Inbox,
  Settings,
  PhoneCall,
} from "lucide-react";
import { CampaignBuilderDialog } from "@/components/messaging/CampaignBuilderDialog";
import { SMSTemplatesManager } from "@/components/messaging/SMSTemplatesManager";
import { VoiceIVRManager } from "@/components/messaging/VoiceIVRManager";
import { CallRecordingsManager } from "@/components/messaging/CallRecordingsManager";
import { EmailInbox } from "@/components/email/EmailInbox";
import { EmailProviderSettings } from "@/components/email/EmailProviderSettings";
import { IVRDashboardTab } from "@/components/communications/IVRDashboardTab";
import { WhatsAppBusinessSetup } from "@/components/communications/WhatsAppBusinessSetup";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  channels: string[];
  recipients: number;
  status: "draft" | "scheduled" | "sending" | "completed" | "failed";
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  createdAt: Date;
  scheduledFor?: Date;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  scheduled: "bg-warning/20 text-warning border-warning/30",
  sending: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-success" />,
  sms: <Phone className="h-4 w-4 text-primary" />,
  email: <Mail className="h-4 w-4 text-warning" />,
};

export default function MessagingCenter() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || "";

  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "campaigns"
  );
  const [isCampaignBuilderOpen, setIsCampaignBuilderOpen] = useState(false);
  const [messageStats, setMessageStats] = useState({
    sent: 0,
    delivered: 0,
    read: 0,
  });

  // Fetch real message stats from broadcast_messages table
  const fetchStats = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("total_recipients, delivered_count, read_count")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, msg) => ({
          sent: acc.sent + (msg.total_recipients || 0),
          delivered: acc.delivered + (msg.delivered_count || 0),
          read: acc.read + (msg.read_count || 0),
        }),
        { sent: 0, delivered: 0, read: 0 }
      );

      setMessageStats(totals);
    } catch (err) {
      console.error("Error fetching message stats:", err);
    }
  }, [tenantId]);

  // Fetch campaigns from broadcast_messages
  const fetchCampaigns = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedCampaigns: Campaign[] = (data || []).map((msg) => ({
        id: msg.id,
        name:
          msg.message.substring(0, 50) + (msg.message.length > 50 ? "..." : ""),
        channels: [msg.channel || "sms"],
        recipients: msg.total_recipients || 0,
        status: "completed" as const,
        sent: msg.total_recipients || 0,
        delivered: msg.delivered_count || 0,
        read: msg.read_count || 0,
        failed: (msg.total_recipients || 0) - (msg.delivered_count || 0),
        createdAt: new Date(msg.created_at),
      }));

      setCampaigns(mappedCampaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
  }, [fetchStats, fetchCampaigns]);

  const stats = {
    totalSent: messageStats.sent,
    totalDelivered: messageStats.delivered,
    totalRead: messageStats.read,
    deliveryRate:
      messageStats.sent > 0
        ? Math.round((messageStats.delivered / messageStats.sent) * 100)
        : 0,
  };

  const handleCreateCampaign = (data: any) => {
    const newCampaign: Campaign = {
      id: `${campaigns.length + 1}`,
      name: data.name,
      channels: data.channels,
      recipients: data.recipients.length,
      status: data.scheduleType === "now" ? "sending" : "scheduled",
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      createdAt: new Date(),
      scheduledFor:
        data.scheduleType === "scheduled"
          ? new Date(data.scheduledDate)
          : undefined,
    };
    setCampaigns([newCampaign, ...campaigns]);
    toast.success(
      `Campaign "${data.name}" ${
        data.scheduleType === "now" ? "launched" : "scheduled"
      } successfully`
    );
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Messaging Center">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                  <p className="text-xs text-muted-foreground">Messages Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDelivered}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Eye className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRead}</p>
                  <p className="text-xs text-muted-foreground">Read</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp Setup</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="voice">Voice & IVR</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
              <TabsTrigger value="ivr-dashboard" className="gap-1.5">
                <PhoneCall className="h-3.5 w-3.5" />
                IVR Dashboard
              </TabsTrigger>
            </TabsList>

            <Button
              variant="gradient"
              onClick={() => setIsCampaignBuilderOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>

            <Card className="bg-card/50 border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Campaign</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-border/50">
                      <TableCell>
                        <p className="font-medium">{campaign.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {campaign.channels.map((ch) => (
                            <div key={ch} className="p-1">
                              {channelIcons[ch]}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.recipients}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status]}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.status === "completed" ||
                        campaign.status === "sending" ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-16">
                                Delivered
                              </span>
                              <Progress
                                value={
                                  (campaign.delivered /
                                    Math.max(1, campaign.sent)) *
                                  100
                                }
                                className="h-1.5 flex-1"
                              />
                              <span>
                                {campaign.delivered}/{campaign.sent}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-16">
                                Read
                              </span>
                              <Progress
                                value={
                                  (campaign.read /
                                    Math.max(1, campaign.delivered)) *
                                  100
                                }
                                className="h-1.5 flex-1"
                              />
                              <span>
                                {campaign.read}/{campaign.delivered}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.scheduledFor ? (
                            <div className="flex items-center gap-1 text-warning">
                              <Clock className="h-3 w-3" />
                              {format(campaign.scheduledFor, "MMM dd, HH:mm")}
                            </div>
                          ) : (
                            format(campaign.createdAt, "MMM dd, yyyy")
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppBusinessSetup tenantId={tenantId} />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Tabs defaultValue="inbox" className="space-y-4">
              <TabsList>
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Provider Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox">
                <EmailInbox />
              </TabsContent>
              <TabsContent value="settings">
                <EmailProviderSettings />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <SMSTemplatesManager />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <VoiceIVRManager />
          </TabsContent>

          <TabsContent value="recordings" className="space-y-4">
            <CallRecordingsManager />
          </TabsContent>

          <TabsContent value="ivr-dashboard" className="space-y-4">
            <IVRDashboardTab />
          </TabsContent>
        </Tabs>
      </div>

      <CampaignBuilderDialog
        open={isCampaignBuilderOpen}
        onOpenChange={setIsCampaignBuilderOpen}
        onSubmit={handleCreateCampaign}
      />
    </DashboardLayout>
  );
}
