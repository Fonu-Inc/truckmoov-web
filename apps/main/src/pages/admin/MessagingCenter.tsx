import {
  formatDate, formatDayMonthTime, formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  BarChart3, CalendarIcon, CheckCircle, Clock, Copy, Eye,
  SlidersHorizontal as Filter, Inbox, Mail,
  MoreHorizontal, Phone, PhoneCall, Plus, Search, Send, Trash2, TrendingUp, Users,
} from "lucide-react";
import {
  useCallback, useEffect, useState,
} from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { IVRDashboardTab } from "@/components/communications/IVRDashboardTab";
import { WhatsAppBusinessSetup } from "@/components/communications/WhatsAppBusinessSetup";
import { EmailInbox } from "@/components/email/EmailInbox";
import { EmailProviderSettings } from "@/components/email/EmailProviderSettings";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CallRecordingsManager } from "@/components/messaging/CallRecordingsManager";
import { CampaignBuilderDialog } from "@/components/messaging/CampaignBuilderDialog";
import { SMSTemplatesManager } from "@/components/messaging/SMSTemplatesManager";
import { VoiceIVRManager } from "@/components/messaging/VoiceIVRManager";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { useAuthStore } from "@/stores/authStore";

type Campaign = {
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
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  scheduled: "bg-warning/20 text-warning border-warning/30",
  sending: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppIcon className="h-4 w-4 text-success" />,
  sms: <Phone className="h-4 w-4 text-primary" />,
  email: <Mail className="h-4 w-4 text-warning" />,
};

const ALL_CHANNELS = [
  {
    value: "whatsapp", label: "WhatsApp",
  },
  {
    value: "sms", label: "SMS",
  },
  {
    value: "email", label: "Email",
  },
  {
    value: "voice", label: "Voice",
  },
];

export default function MessagingCenter() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || "";

  const [searchParams] = useSearchParams();
  const [
    campaigns,
    setCampaigns,
  ] = useState<Campaign[]>([]);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    activeTab,
    setActiveTab,
  ] = useState(searchParams.get("tab") || "campaigns");
  const [
    isCampaignBuilderOpen,
    setIsCampaignBuilderOpen,
  ] = useState(false);
  const [messageStats] = useState({
    sent: 0, delivered: 0, read: 0,
  });
  const [
    campaignChannelFilter,
    setCampaignChannelFilter,
  ] = useState<string>("all");
  const [
    campaignDate,
    setCampaignDate,
  ] = useState<Date | undefined>();
  const [
    campaignDateRange,
    setCampaignDateRange,
  ] = useState<string>("all");

  // Fetch real message stats from broadcast_messages table
  const fetchStats = useCallback(
    async () => {
    // Coming soon
    },
    [tenantId],
  );

  // Fetch campaigns from broadcast_messages
  const fetchCampaigns = useCallback(
    async () => {
    // Coming soon
    },
    [tenantId],
  );

  useEffect(
    () => {
      fetchStats();
      fetchCampaigns();
    },
    [
      fetchStats,
      fetchCampaigns,
    ],
  );

  const stats = {
    totalSent: messageStats.sent,
    totalDelivered: messageStats.delivered,
    totalRead: messageStats.read,
    deliveryRate: messageStats.sent > 0 ? Math.round((messageStats.delivered / messageStats.sent) * 100) : 0,
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
      scheduledFor: data.scheduleType === "scheduled" ? new Date(data.scheduledDate) : undefined,
    };
    setCampaigns([
      newCampaign,
      ...campaigns,
    ]);
    toast.success(`Campaign "${data.name}" ${data.scheduleType === "now" ? "launched" : "scheduled"} successfully`);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesChannel
      = campaignChannelFilter === "all" || c.channels.includes(campaignChannelFilter);
    const matchesDate = !campaignDate
      || toDateParam(c.createdAt) === toDateParam(campaignDate);
    let matchesRange = true;
    if (campaignDateRange !== "all") {
      const days = parseInt(campaignDateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      matchesRange = c.createdAt >= cutoff;
    }
    return matchesSearch && matchesStatus && matchesChannel && matchesDate && matchesRange;
  });

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
                  <p className="text-2xl font-bold">
                    {stats.deliveryRate}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-muted/50 flex w-full flex-wrap h-auto gap-0.5 p-0.5 mb-4">
            <TabsTrigger
              value="campaigns"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              WhatsApp Setup
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              Email
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              Voice & IVR
            </TabsTrigger>
            <TabsTrigger
              value="recordings"
              className="flex-1 min-w-fit px-2 text-xs sm:text-sm"
            >
              Recordings
            </TabsTrigger>
            <TabsTrigger
              value="ivr-dashboard"
              className="flex-1 min-w-fit gap-1 px-2 text-xs sm:text-sm"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              IVR Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="campaigns"
            className="space-y-4"
          >
            <div className="flex justify-end">
              <Button
                variant="gradient"
                onClick={() => setIsCampaignBuilderOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Campaigns
                    </CardTitle>
                    <CardDescription className="mt-1">All outbound broadcast campaigns — track delivery, channel mix, and performance.</CardDescription>
                  </div>
                  <ExportButton
                    filename="campaigns"
                    rows={filteredCampaigns}
                    columns={[
                      {
                        header: "Campaign", accessor: c => c.name,
                      },
                      {
                        header: "Channels", accessor: c => c.channels.join(", "),
                      },
                      {
                        header: "Recipients", accessor: c => c.recipients,
                      },
                      {
                        header: "Status", accessor: c => c.status,
                      },
                      {
                        header: "Sent", accessor: c => c.sent,
                      },
                      {
                        header: "Delivered", accessor: c => c.delivered,
                      },
                      {
                        header: "Read", accessor: c => c.read,
                      },
                      {
                        header: "Date", accessor: c => toDateParam(c.createdAt),
                      },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 bg-card/50 border-border/50"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full md:w-[160px] bg-card/50 border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-card/50 border-border/50"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {" "}
                        Filter
                        {(campaignChannelFilter !== "all" || campaignDate || campaignDateRange !== "all") && (
                          <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground">
                            {[
                              campaignChannelFilter !== "all" ? 1 : 0,
                              campaignDate ? 1 : 0,
                              campaignDateRange !== "all" ? 1 : 0,
                            ].reduce(
                              (a, b) => a + b,
                              0,
                            )}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                      align="end"
                    >
                      <h4 className="text-xs font-medium text-foreground px-0.5">
                        Only show campaigns by...
                      </h4>
                      <div className="space-y-4">
                        {/* Channel */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="flt-channel"
                              checked={campaignChannelFilter !== "all"}
                              onCheckedChange={c => setCampaignChannelFilter(c === true ? (campaignChannelFilter !== "all" ? campaignChannelFilter : "whatsapp") : "all")}
                            />
                            <Label
                              htmlFor="flt-channel"
                              className="text-sm cursor-pointer"
                            >
                              Channel
                            </Label>
                          </div>
                          <Select
                            value={campaignChannelFilter === "all" ? "" : campaignChannelFilter}
                            onValueChange={v => setCampaignChannelFilter(v || "all")}
                            disabled={campaignChannelFilter === "all"}
                          >
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select channel" /></SelectTrigger>
                            <SelectContent>
                              {ALL_CHANNELS.map(c => (
                                <SelectItem
                                  key={c.value}
                                  value={c.value}
                                >
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Date range */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="flt-range"
                              checked={campaignDateRange !== "all"}
                              onCheckedChange={c => setCampaignDateRange(c === true ? (campaignDateRange !== "all" ? campaignDateRange : "7") : "all")}
                            />
                            <Label
                              htmlFor="flt-range"
                              className="text-sm cursor-pointer"
                            >
                              Date range
                            </Label>
                          </div>
                          <Select
                            value={campaignDateRange === "all" ? "" : campaignDateRange}
                            onValueChange={v => setCampaignDateRange(v || "all")}
                            disabled={campaignDateRange === "all"}
                          >
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select range" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Today</SelectItem>
                              <SelectItem value="7">Last 7 days</SelectItem>
                              <SelectItem value="30">Last 30 days</SelectItem>
                              <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Specific date */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="flt-date"
                              checked={!!campaignDate}
                              onCheckedChange={(c) => {
                                if (c !== true)
                                  setCampaignDate(undefined);
                              }}
                            />
                            <Label
                              htmlFor="flt-date"
                              className="text-sm cursor-pointer"
                            >
                              Specific date
                            </Label>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start font-normal h-9"
                                disabled={false}
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {campaignDate
                                  ? formatWithPattern(
                                      campaignDate,
                                      "PP",
                                    )
                                  : "DD/MM/YYYY"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={campaignDate}
                                onSelect={setCampaignDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button className="flex-1">Apply</Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setCampaignChannelFilter("all");
                            setCampaignDate(undefined);
                            setCampaignDateRange("all");
                          }}
                        >
                          Show All
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
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
                  {filteredCampaigns.map(campaign => (
                    <TableRow
                      key={campaign.id}
                      className="border-border/50"
                    >
                      <TableCell>
                        <p className="font-medium">{campaign.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {campaign.channels.map(ch => (
                            <div
                              key={ch}
                              className="p-1"
                            >
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
                        {campaign.status === "completed" || campaign.status === "sending"
                          ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground w-16">Delivered</span>
                                  <Progress
                                    value={(campaign.delivered / Math.max(
                                      1,
                                      campaign.sent,
                                    )) * 100}
                                    className="h-1.5 flex-1"
                                  />
                                  <span>
                                    {campaign.delivered}
                                    /
                                    {campaign.sent}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground w-16">Read</span>
                                  <Progress
                                    value={(campaign.read / Math.max(
                                      1,
                                      campaign.delivered,
                                    )) * 100}
                                    className="h-1.5 flex-1"
                                  />
                                  <span>
                                    {campaign.read}
                                    /
                                    {campaign.delivered}
                                  </span>
                                </div>
                              </div>
                            )
                          : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.scheduledFor
                            ? (
                                <div className="flex items-center gap-1 text-warning">
                                  <Clock className="h-3 w-3" />
                                  {formatDayMonthTime(campaign.scheduledFor)}
                                </div>
                              )
                            : (
                                formatDate(campaign.createdAt)
                              )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
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

          <TabsContent
            value="whatsapp"
            className="space-y-4"
          >
            <WhatsAppBusinessSetup tenantId={tenantId} />
          </TabsContent>

          <TabsContent
            value="email"
            className="space-y-4"
          >
            <Tabs
              defaultValue="inbox"
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger
                  value="inbox"
                  className="flex items-center gap-2"
                >
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

          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <SMSTemplatesManager />
          </TabsContent>

          <TabsContent
            value="voice"
            className="space-y-4"
          >
            <VoiceIVRManager />
          </TabsContent>

          <TabsContent
            value="recordings"
            className="space-y-4"
          >
            <CallRecordingsManager />
          </TabsContent>

          <TabsContent
            value="ivr-dashboard"
            className="space-y-4"
          >
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
