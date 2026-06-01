import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from "@/components/shadcn/dropdown-menu";
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Archive,
  Search,
  Plus,
  Paperclip,
  Reply,
  Forward,
  ArrowLeft,
  Loader2,
  MailOpen,
  CheckSquare,
  MoreVertical,
  AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/shadcn/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

interface Email {
  id: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  folder: "inbox" | "sent" | "starred" | "trash";
  labels?: string[];
}

const DEMO_EMAILS: Email[] = [
  { id: "d1", from: { name: "Olumide Adeyemi", email: "olumide@adeyemihaulage.ng" }, to: [{ name: "Dispatch", email: "dispatch@fleetpro.ng" }], subject: "Re: JOB-10421 — Confirmed delivery to Ibadan", preview: "All loaded and en route. Driver Matthias should arrive at the Ibadan depot by...", body: "Hi team,\n\nAll loaded and en route. Driver Matthias should arrive at the Ibadan depot by 14:30 today. POD will be uploaded as soon as offloading completes.\n\nBest,\nOlumide", date: new Date(Date.now() - 1000 * 60 * 22), isRead: false, isStarred: true, hasAttachment: false, folder: "inbox", labels: ["Operations"] },
  { id: "d2", from: { name: "Apapa Port Authority", email: "notifications@apapaport.ng" }, to: [{ name: "Dispatch", email: "dispatch@fleetpro.ng" }], subject: "Gate pass approval — Container ABCU1234567", preview: "Your gate pass request has been approved. Please present this email at Gate 3...", body: "Your gate pass request has been approved.\n\nContainer: ABCU1234567\nVessel: MV Hope\nValid until: Tomorrow 18:00\n\nPlease present this email at Gate 3 along with the original BOL.", date: new Date(Date.now() - 1000 * 60 * 90), isRead: false, isStarred: false, hasAttachment: true, folder: "inbox", labels: ["Compliance"] },
  { id: "d3", from: { name: "Chidi Okonkwo", email: "chidi@okonkwotransport.ng" }, to: [{ name: "Dispatch", email: "dispatch@fleetpro.ng" }], subject: "Invoice INV-2026-0418 — Payment received", preview: "Confirming receipt of ₦1,250,000 for last week's PH-Aba haul. Thank you...", body: "Confirming receipt of ₦1,250,000 for last week's PH-Aba haul.\n\nThank you for the prompt settlement. Looking forward to next week's allocations.", date: new Date(Date.now() - 1000 * 60 * 60 * 4), isRead: true, isStarred: false, hasAttachment: true, folder: "inbox", labels: ["Finance"] },
  { id: "d4", from: { name: "Lagos State VIO", email: "alerts@lagosvio.gov.ng" }, to: [{ name: "Compliance", email: "compliance@fleetpro.ng" }], subject: "Vehicle inspection reminder — TRK-007", preview: "Roadworthiness for vehicle TRK-007 expires in 14 days. Please book an inspection...", body: "Roadworthiness for vehicle TRK-007 expires in 14 days.\n\nPlease book an inspection slot through the VIO portal before the expiry date to avoid penalty.", date: new Date(Date.now() - 1000 * 60 * 60 * 9), isRead: true, isStarred: true, hasAttachment: false, folder: "inbox", labels: ["Compliance"] },
  { id: "d5", from: { name: "Sahara Freight Partners", email: "ops@saharafreight.ng" }, to: [{ name: "Dispatch", email: "dispatch@fleetpro.ng" }], subject: "Capacity available — Kano corridor next week", preview: "We have 3 trucks free Mon-Wed for the Kano corridor. Let us know if you have...", body: "Hi,\n\nWe have 3 trucks free Mon-Wed for the Kano corridor. Let us know if you have any loads we can pick up.\n\nRegards,\nSahara Ops", date: new Date(Date.now() - 1000 * 60 * 60 * 26), isRead: true, isStarred: false, hasAttachment: false, folder: "inbox" },
  { id: "d6", from: { name: "Stripe Receipts", email: "receipts@stripe.com" }, to: [{ name: "Finance", email: "finance@fleetpro.ng" }], subject: "Download for $499.00 — FleetPro Subscription", preview: "Your monthly subscription has been renewed successfully. Download attached...", body: "Thanks for paying with Stripe.\n\nAmount: $499.00\nPlan: FleetPro Premium\nNext billing date: Next month\n\nReceipt attached.", date: new Date(Date.now() - 1000 * 60 * 60 * 38), isRead: true, isStarred: false, hasAttachment: true, folder: "inbox", labels: ["Finance"] },
  { id: "d7", from: { name: "Northbridge Logistics", email: "dispatch@northbridge.ng" }, to: [{ name: "Dispatch", email: "dispatch@fleetpro.ng" }], subject: "Delay notice — Abuja → Jos run", preview: "Heavy rains around Keffi causing 2-3 hour delay. Driver is safe, will resume...", body: "Heavy rains around Keffi causing 2-3 hour delay. Driver is safe and parked at a registered rest stop. Will resume the run once visibility improves.", date: new Date(Date.now() - 1000 * 60 * 60 * 50), isRead: true, isStarred: false, hasAttachment: false, folder: "inbox", labels: ["Operations"] },
  { id: "d8", from: { name: "FleetPro Insights", email: "insights@fleetpro.ng" }, to: [{ name: "Manager", email: "manager@fleetpro.ng" }], subject: "Weekly fleet performance digest", preview: "Your fleet completed 142 deliveries this week with a 96% on-time rate...", body: "Weekly digest:\n\n• 142 deliveries completed\n• 96% on-time rate\n• Top driver: Matthias Okunwe\n• Fuel savings vs last week: 4.2%\n\nView full report in the dashboard.", date: new Date(Date.now() - 1000 * 60 * 60 * 72), isRead: true, isStarred: false, hasAttachment: false, folder: "inbox", labels: ["Reports"] },
  { id: "d9", from: { name: "FleetPro", email: "dispatch@fleetpro.ng" }, to: [{ name: "Adeyemi Haulage", email: "olumide@adeyemihaulage.ng" }], subject: "JOB-10428 assignment confirmation", preview: "Confirming assignment of JOB-10428 (Ibadan → Akure) to your fleet...", body: "Confirming assignment of JOB-10428 (Ibadan → Akure) to your fleet.\n\nPickup: Tomorrow 06:00\nValue: ₦195,000\n\nReply if you have any questions.", date: new Date(Date.now() - 1000 * 60 * 60 * 5), isRead: true, isStarred: false, hasAttachment: false, folder: "sent" },
  { id: "d10", from: { name: "FleetPro", email: "dispatch@fleetpro.ng" }, to: [{ name: "Compliance", email: "compliance@trans-sahel.ng" }], subject: "Updated insurance certificate request", preview: "Please share the latest comprehensive insurance certificate for vehicles assigned...", body: "Please share the latest comprehensive insurance certificate for vehicles assigned to our cross-border routes. Required for the upcoming audit.", date: new Date(Date.now() - 1000 * 60 * 60 * 28), isRead: true, isStarred: false, hasAttachment: false, folder: "sent" },
];

export function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>(DEMO_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "starred" | "trash">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "" });

  const filteredEmails = emails.filter((email) => {
    const matchesFolder = activeFolder === "starred" 
      ? email.isStarred 
      : email.folder === activeFolder;
    const matchesSearch = searchQuery === "" || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const unreadCount = emails.filter((e) => !e.isRead && e.folder === "inbox").length;

  const allVisibleSelected = filteredEmails.length > 0 && filteredEmails.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStar = () => {
    setEmails((prev) => prev.map((e) => (selectedIds.has(e.id) ? { ...e, isStarred: true } : e)));
    toast.success(`Starred ${selectedIds.size} email${selectedIds.size > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
  };

  const handleBulkRead = () => {
    setEmails((prev) => prev.map((e) => (selectedIds.has(e.id) ? { ...e, isRead: true } : e)));
    toast.success(`Marked ${selectedIds.size} as read`);
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    setEmails((prev) => prev.map((e) => (selectedIds.has(e.id) ? { ...e, folder: "trash" } : e)));
    toast.success(`Archived ${selectedIds.size} email${selectedIds.size > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setEmails((prev) => prev.map((e) => (selectedIds.has(e.id) ? { ...e, folder: "trash" } : e)));
    toast.success(`Moved ${selectedIds.size} to trash`);
    setSelectedIds(new Set());
    setSelectedEmail(null);
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error("Please fill in recipient and subject");
      return;
    }
    
    setIsSending(true);
    setTimeout(() => {
      const newEmail: Email = {
        id: Date.now().toString(),
        from: { name: "FleetPro", email: "dispatch@fleetpro.ng" },
        to: [{ name: composeData.to.split("@")[0], email: composeData.to }],
        subject: composeData.subject,
        preview: composeData.body.substring(0, 100),
        body: composeData.body,
        date: new Date(),
        isRead: true,
        isStarred: false,
        hasAttachment: false,
        folder: "sent" };
      setEmails((prev) => [newEmail, ...prev]);
      setIsSending(false);
      setIsComposing(false);
      setComposeData({ to: "", subject: "", body: "" });
      toast.success("Email sent successfully");
    }, 1500);
  };

  const handleToggleStar = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
    );
  };

  const handleMarkAsRead = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isRead: true } : e))
    );
  };

  const handleDelete = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, folder: "trash" } : e))
    );
    setSelectedEmail(null);
    toast.success("Email moved to trash");
  };

  const openEmail = (email: Email) => {
    setSelectedEmail(email);
    handleMarkAsRead(email.id);
    setIsReplying(false);
    setReplyBody("");
  };

  const isReplyable = (email: Email) => {
    if (email.folder === "sent") return false;
    const addr = email.from.email.toLowerCase();
    const noReplyPatterns = ["noreply", "no-reply", "do-not-reply", "donotreply", "notifications@", "alerts@", "receipts@", "insights@", "mailer-daemon", "postmaster@"];
    return !noReplyPatterns.some((p) => addr.includes(p));
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    const reply: Email = {
      id: Date.now().toString(),
      from: { name: "FleetPro", email: "dispatch@fleetpro.ng" },
      to: [selectedEmail.from],
      subject: selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      preview: replyBody.substring(0, 100),
      body: replyBody,
      date: new Date(),
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      folder: "sent",
    };
    setEmails((prev) => [reply, ...prev]);
    setReplyBody("");
    setIsReplying(false);
    toast.success("Reply sent");
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] gap-3">
      {/* Sidebar */}
      <div className="w-40 flex-shrink-0 space-y-2">
        <Dialog open={isComposing} onOpenChange={setIsComposing}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="To: email@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <textarea
                  className="w-full min-h-[200px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-1 pt-4">
          {[
            { id: "inbox", label: "Inbox", icon: Inbox, count: unreadCount },
            { id: "sent", label: "Sent", icon: Send },
            { id: "starred", label: "Starred", icon: Star },
            { id: "trash", label: "Trash", icon: Trash2 },
          ].map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                setActiveFolder(folder.id as typeof activeFolder);
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFolder === folder.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <folder.icon className="h-4 w-4" />
                <span>{folder.label}</span>
              </div>
              {folder.count && folder.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {folder.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <Card className="flex-1 min-w-0 flex flex-col">
        <CardHeader className="pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {/* Bulk action toolbar */}
          <div className="flex items-center gap-1 border-t border-border/50 pt-2">
            <div className="flex items-center pl-1 pr-2">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </div>
            {someSelected ? (
              <>
                <span className="text-xs text-muted-foreground mr-1">
                  {selectedIds.size} selected
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBulkStar} title="Star">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBulkRead} title="Mark as read">
                  <MailOpen className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBulkArchive} title="Archive">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleBulkDelete} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Select messages for bulk actions
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <ScrollArea className="h-full">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">No emails found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Your inbox is empty"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => openEmail(email)}
                    className={`flex items-start gap-2 px-3 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${
                      !email.isRead ? "bg-primary/5" : ""
                    } ${selectedEmail?.id === email.id ? "bg-muted/50" : ""} ${
                      selectedIds.has(email.id) ? "bg-primary/10" : ""
                    }`}
                  >
                    <div
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(email.id);
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(email.id)}
                        aria-label="Select email"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(email.id);
                      }}
                      className="mt-1"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          email.isStarred
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium truncate ${!email.isRead ? "font-semibold" : ""}`}>
                          {email.folder === "sent" ? email.to[0].name : email.from.name}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(email.date, "MMM d")}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!email.isRead ? "font-medium" : "text-muted-foreground"}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {email.preview}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {email.hasAttachment && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                        {email.labels?.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs py-0">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Detail */}
      {selectedEmail && (
        <Card className="w-[340px] flex-shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmail(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-1">
                {isReplyable(selectedEmail) && (
                  <Button variant="outline" size="sm" onClick={() => setIsReplying((v) => !v)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(selectedEmail.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => handleToggleStar(selectedEmail.id)}>
                      <Star className={`h-4 w-4 mr-2 ${selectedEmail.isStarred ? "fill-warning text-warning" : ""}`} />
                      {selectedEmail.isStarred ? "Unstar" : "Star message"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEmails((prev) => prev.map((e) => (e.id === selectedEmail.id ? { ...e, isRead: false } : e)));
                        toast.success("Marked as unread");
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Mark as unread
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEmails((prev) => prev.map((e) => (e.id === selectedEmail.id ? { ...e, folder: "trash" } : e)));
                        setSelectedEmail(null);
                        toast.success("Email archived");
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success("Reported as spam")}>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Report spam
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(selectedEmail.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEmail.subject}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {selectedEmail.labels?.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{selectedEmail.from.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmail.from.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {format(selectedEmail.date, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[300px]">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedEmail.body}
                </div>
              </ScrollArea>

              {selectedEmail.hasAttachment && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">1 attachment</span>
                    <Button variant="link" size="sm" className="ml-auto">
                      Download
                    </Button>
                  </div>
                </>
              )}

              {isReplying && isReplyable(selectedEmail) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Reply to {selectedEmail.from.name} &lt;{selectedEmail.from.email}&gt;
                    </p>
                    <textarea
                      className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Write your reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setIsReplying(false); setReplyBody(""); }}>
                        Cancel
                      </Button>
                      <Button variant="gradient" size="sm" onClick={handleSendReply}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



