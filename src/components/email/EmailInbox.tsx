import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Archive,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Paperclip,
  Reply,
  Forward,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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

// No mock emails - new tenants start with empty inbox
// In a real implementation, this would fetch from email service/database

export function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "starred" | "trash">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
  });

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Inbox refreshed");
    }, 1500);
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
        from: { name: "TruckMoov", email: "dispatch@truckmoov.ng" },
        to: [{ name: composeData.to.split("@")[0], email: composeData.to }],
        subject: composeData.subject,
        preview: composeData.body.substring(0, 100),
        body: composeData.body,
        date: new Date(),
        isRead: true,
        isStarred: false,
        hasAttachment: false,
        folder: "sent",
      };
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
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] gap-4">
      {/* Sidebar */}
      <div className="w-48 shrink-0 space-y-2">
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
                  className="w-full min-h-[200px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-hidden focus:ring-2 focus:ring-ring"
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
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
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
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/30 ${
                      !email.isRead ? "bg-primary/5" : ""
                    } ${selectedEmail?.id === email.id ? "bg-muted/50" : ""}`}
                  >
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
                        <span className="text-xs text-muted-foreground shrink-0">
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
        <Card className="w-[400px] shrink-0">
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
                <Button variant="ghost" size="icon">
                  <Reply className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Forward className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(selectedEmail.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
