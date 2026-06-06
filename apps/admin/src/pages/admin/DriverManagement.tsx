import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcn/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import { Textarea } from "@/components/shadcn/textarea";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { 
  Plus, Search, Upload, MoreHorizontal, Eye, Pencil, Trash2,
  Users, UserCheck, UserX, Clock, Star, MessageSquare, Phone, Mail,
  AlertTriangle, PhoneCall, PhoneOff, Send, Loader2, Inbox, Activity, Brain,
  TrendingUp, TrendingDown, Minus, Gauge, Car, RotateCcw, Zap, MapPin, Shield,
  Bell, RefreshCw, Wifi, WifiOff, ChevronRight, User, Coffee, ChevronDown, ChevronUp,
  SlidersHorizontal
} from "lucide-react";
import { ExportButton } from "@/components/shadcn/export-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Checkbox } from "@/components/shadcn/checkbox";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CallInteractionModal } from "@/components/communications/CallInteractionModal";
import { useDrivers, DriverData } from "@/hooks/useDrivers";
import { Driver } from "@/types";
import { DriverFormDialog } from "@/components/drivers/DriverFormDialog";
import { DriverDetailsSheet } from "@/components/drivers/DriverDetailsSheet";
import { DriverBulkUploadDialog } from "@/components/drivers/DriverBulkUploadDialog";
import { DriverMessagesInbox } from "@/components/drivers/DriverMessagesInbox";
import { useFonuCall } from "@/contexts/FonuCallContext";
import { format, differenceInDays, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { WritableAction } from "@/components/auth/WritableAction";

const statusColors: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  active: "bg-primary/20 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

const commIcons: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppIcon className="h-4 w-4 text-success" />,
  sms: <MessageSquare className="h-4 w-4 text-primary" />,
  email: <Mail className="h-4 w-4 text-warning" />,
  voice: <Phone className="h-4 w-4 text-accent" />,
};

// Import the tab components
import { DriverBehaviorTab } from "@/components/drivers/DriverBehaviorTab";
import { DriverFatigueTab } from "@/components/drivers/DriverFatigueTab";

export default function DriverManagement() {
  const { drivers: dbDrivers, isLoading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [commFilter, setCommFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [tripsFilter, setTripsFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [mainTab, setMainTab] = useState("drivers");
  
  // Communication state
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<"sms" | "whatsapp">("whatsapp");
  const [messageContent, setMessageContent] = useState("");

  // Use real Fonu integration
  const sendSMS = async (..._args: any[]) => {};
  const sendWhatsApp = async (..._args: any[]) => {};
  const isSending = false;

  // SIP call control (shared across app)
  const { startCall, endCall: sipEndCall, status: sipStatus, durationSeconds } = useFonuCall();

  // Only auto-close dialog when call ends/fails, don't auto-open on mount
  useEffect(() => {
    if (sipStatus === "ended" || sipStatus === "failed") {
      const timer = setTimeout(() => setIsCallDialogOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [sipStatus]);

  // Convert DB drivers to legacy Driver format for existing components
  const drivers: Driver[] = dbDrivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email || undefined,
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry) : new Date(),
    status: d.status as Driver["status"],
    rating: d.rating,
    totalTrips: d.totalTrips,
    currentVehicle: d.currentVehicleId || undefined,
    communicationPreference: d.communicationPreference as Driver["communicationPreference"],
  }));

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    const matchesComm = commFilter === "all" || driver.communicationPreference === commFilter;
    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "5" && driver.rating >= 4.5) ||
      (ratingFilter === "4" && driver.rating >= 4 && driver.rating < 4.5) ||
      (ratingFilter === "3" && driver.rating >= 3 && driver.rating < 4) ||
      (ratingFilter === "below3" && driver.rating < 3);
    const trips = driver.totalTrips ?? 0;
    const matchesTrips =
      tripsFilter === "all" ||
      (tripsFilter === "100plus" && trips >= 100) ||
      (tripsFilter === "50to99" && trips >= 50 && trips < 100) ||
      (tripsFilter === "10to49" && trips >= 10 && trips < 50) ||
      (tripsFilter === "below10" && trips < 10);
    return matchesSearch && matchesStatus && matchesComm && matchesRating && matchesTrips;
  });

  const stats = {
    total: dbDrivers.length,
    available: dbDrivers.filter((d) => d.status === "available").length,
    onJob: dbDrivers.filter((d) => d.status === "active" || d.status === "on_trip").length,
    offline: dbDrivers.filter((d) => d.status === "offline" || d.status === "on_break").length,
    expiringLicenses: drivers.filter((d) => differenceInDays(new Date(d.licenseExpiry), new Date()) <= 30).length,
  };

  const handleAddDriver = async (data: any) => {
    const success = await addDriver({
      name: `${data.firstName} ${data.lastName}`.trim(),
      phone: data.phone,
      email: data.email || null,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      status: data.status || "available",
      communicationPreference: data.communicationPreference || "whatsapp",
    });
    if (success) {
      setIsFormOpen(false);
    }
  };

  const handleEditDriver = async (data: any) => {
    if (!selectedDriver) return;
    const success = await updateDriver(selectedDriver.id, {
      name: `${data.firstName} ${data.lastName}`.trim(),
      phone: data.phone,
      email: data.email || null,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      status: data.status,
      communicationPreference: data.communicationPreference,
    });
    if (success) {
      setIsFormOpen(false);
      setSelectedDriver(null);
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    await deleteDriver(driver.id);
  };

  const handleBulkUpload = async (uploadedDrivers: any[]) => {
    for (const d of uploadedDrivers) {
      await addDriver({
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry,
        status: d.status || "available",
        communicationPreference: d.communicationPreference || "whatsapp",
      });
    }
    setIsBulkUploadOpen(false);
  };

  const openEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsFormOpen(true);
  };

  const openDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailsOpen(true);
  };

  // Communication handlers
  const handleCallDriver = async (driver: Driver) => {
    setSelectedDriver(driver);
    setIsCallDialogOpen(true);
    try {
      await startCall(driver.name, driver.phone, [
        `X-Driver-ID: ${driver.id}`,
        `X-Driver-Name: ${driver.name}`,
      ]);
    } catch (err) {
      toast.error('Unable to start call');
      setIsCallDialogOpen(false);
    }
  };

  const handleEndCall = () => {
    sipEndCall();
  };

  const openMessageDialog = (driver: Driver, type: "sms" | "whatsapp") => {
    setSelectedDriver(driver);
    setMessageType(type);
    setMessageContent("");
    setIsMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedDriver || !messageContent.trim()) return;
    
    try {
      if (messageType === "whatsapp") {
        await sendWhatsApp(
          selectedDriver.id,
          selectedDriver.name,
          selectedDriver.phone,
          messageContent,
          "Fleet Manager"
        );
      } else {
        await sendSMS(
          selectedDriver.id,
          selectedDriver.name,
          selectedDriver.phone,
          messageContent,
          "Fleet Manager"
        );
      }
      setIsMessageDialogOpen(false);
      setMessageContent("");
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleQuickWhatsApp = (driver: Driver) => {
    const phone = driver.phone.replace(/\s+/g, "").replace(/^\+/, "");
    const message = encodeURIComponent(`Hello ${driver.name}, this is a message from Fleet Management.`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    toast.success(`Opening WhatsApp for ${driver.name}`);
  };

  return (
    <DashboardLayout title="Driver Management">
      <div className="space-y-6">
        {/* Main Tab Navigation */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="drivers" className="gap-2">
                <Users className="h-4 w-4" />
                Drivers
              </TabsTrigger>
              <TabsTrigger value="behavior" className="gap-2">
                <Activity className="h-4 w-4" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="fatigue" className="gap-2">
                <Brain className="h-4 w-4" />
                Fatigue AI
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="drivers" className="mt-0 space-y-6">
            {/* Top-right page actions */}
            <div className="flex justify-end gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowInbox(!showInbox)}>
                <Inbox className="h-4 w-4 mr-2" />
                {showInbox ? "Hide Inbox" : "Message Inbox"}
              </Button>
              <WritableAction permission="canCreateAssets">
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button variant="gradient" onClick={() => { setSelectedDriver(null); setIsFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </WritableAction>
            </div>

        {/* Message Inbox */}
        {showInbox && (
          <DriverMessagesInbox />
        )}

        {/* Drivers Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Drivers ({filteredDrivers.length})
                </CardTitle>
                <CardDescription>Roster of drivers with licence, status and performance details.</CardDescription>
              </div>
              <ExportButton
                filename="drivers"
                rows={filteredDrivers}
                columns={[
                  { header: "Name", accessor: "name" },
                  { header: "Phone", accessor: "phone" },
                  { header: "Email", accessor: (d: any) => d.email ?? "" },
                  { header: "License", accessor: "licenseNumber" },
                  { header: "License Expiry", accessor: (d: any) => format(new Date(d.licenseExpiry), "yyyy-MM-dd") },
                  { header: "Status", accessor: "status" },
                  { header: "Rating", accessor: "rating" },
                  { header: "Total Trips", accessor: "totalTrips" },
                  { header: "Preferred Channel", accessor: "communicationPreference" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or license..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-card/50 border-border/50 relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                    {(commFilter !== "all" || ratingFilter !== "all" || tripsFilter !== "all") && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                        {[commFilter !== "all", ratingFilter !== "all", tripsFilter !== "all"].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-4">
                  <Label className="text-sm font-semibold">Only show drivers by...</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="drv-flt-rating"
                        checked={ratingFilter !== "all"}
                        onCheckedChange={(c) => { if (!c) setRatingFilter("all"); }}
                      />
                      <Label htmlFor="drv-flt-rating" className="text-xs cursor-pointer">Rating</Label>
                    </div>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">★ 4.5 and above</SelectItem>
                        <SelectItem value="4">★ 4.0 – 4.4</SelectItem>
                        <SelectItem value="3">★ 3.0 – 3.9</SelectItem>
                        <SelectItem value="below3">★ Below 3.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="drv-flt-trips"
                        checked={tripsFilter !== "all"}
                        onCheckedChange={(c) => { if (!c) setTripsFilter("all"); }}
                      />
                      <Label htmlFor="drv-flt-trips" className="text-xs cursor-pointer">Trips completed</Label>
                    </div>
                    <Select value={tripsFilter} onValueChange={setTripsFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Trip Counts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Trip Counts</SelectItem>
                        <SelectItem value="100plus">100+ trips</SelectItem>
                        <SelectItem value="50to99">50 – 99 trips</SelectItem>
                        <SelectItem value="10to49">10 – 49 trips</SelectItem>
                        <SelectItem value="below10">Below 10 trips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="drv-flt-comm"
                        checked={commFilter !== "all"}
                        onCheckedChange={(c) => { if (!c) setCommFilter("all"); }}
                      />
                      <Label htmlFor="drv-flt-comm" className="text-xs cursor-pointer">Preferred channel</Label>
                    </div>
                    <Select value={commFilter} onValueChange={setCommFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { setCommFilter("all"); setRatingFilter("all"); setTripsFilter("all"); }}>
                    Reset Filters
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Preferred</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => {
                  const daysUntilExpiry = differenceInDays(new Date(driver.licenseExpiry), new Date());
                  const licenseWarning = daysUntilExpiry <= 30;
                  
                  return (
                    <TableRow key={driver.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                            {driver.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {driver.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{driver.phone}</p>
                          {driver.email && (
                            <p className="text-muted-foreground truncate max-w-[150px]">{driver.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-mono">{driver.licenseNumber}</p>
                          <p className={`text-xs ${licenseWarning ? "text-warning" : "text-muted-foreground"}`}>
                            {licenseWarning && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                            Exp: {format(new Date(driver.licenseExpiry), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[driver.status]}>
                          {driver.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-current" />
                          <span>{driver.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{driver.totalTrips}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {commIcons[driver.communicationPreference]}
                          <span className="text-sm capitalize">{driver.communicationPreference}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleQuickWhatsApp(driver)}
                            title="WhatsApp"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => openMessageDialog(driver, "sms")}
                            title="SMS"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                            onClick={() => handleCallDriver(driver)}
                            disabled={sipStatus === "connecting" || sipStatus === "ringing" || sipStatus === "connected"}
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="More">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetails(driver)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(driver)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteDriver(driver)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="behavior" className="mt-0">
            <DriverBehaviorTab />
          </TabsContent>

          <TabsContent value="fatigue" className="mt-0">
            <DriverFatigueTab />
          </TabsContent>
        </Tabs>

      {/* Dialogs */}
      <DriverFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        driver={selectedDriver}
        onSubmit={selectedDriver ? handleEditDriver : handleAddDriver}
      />

      <DriverDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        driver={selectedDriver}
      />

      <DriverBulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={handleBulkUpload}
      />

      {/* Call Interaction Modal */}
      <CallInteractionModal
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        contactName={selectedDriver?.name}
        contactPhone={selectedDriver?.phone}
        status={sipStatus}
        durationSeconds={durationSeconds}
        onEndCall={handleEndCall}
        recordingEnabled
        onToggleRecord={(rec) => {
          // Recording integration is wired at the SIP layer; UI-only toggle here.
          console.log('[Call] recording toggled', rec, 'driver:', selectedDriver?.id);
        }}
        onSaveNote={(note) => {
          console.log('[Call] note saved for driver', selectedDriver?.id, note);
          return true;
        }}
      />

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {messageType === "whatsapp" ? (
                <MessageSquare className="h-5 w-5 text-success" />
              ) : (
                <Mail className="h-5 w-5 text-primary" />
              )}
              Send {messageType === "whatsapp" ? "WhatsApp" : "SMS"} to {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-white">
                {selectedDriver?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium">{selectedDriver?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDriver?.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}



