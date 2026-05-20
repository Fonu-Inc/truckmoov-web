import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockDrivers } from "@/data/mockData";
import { MessagePreview } from "./MessagePreview";
import { FormattingToolbar } from "./FormattingToolbar";
import { 
  MessageSquare, Phone, Mail, Users, Send, Clock,
  CheckCircle, Sparkles
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name required").max(100),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  scheduleType: z.enum(["now", "scheduled"]),
  scheduledDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CampaignFormData & { channels: string[]; recipients: string[] }) => void;
}

export function CampaignBuilderDialog({ open, onOpenChange, onSubmit }: CampaignBuilderDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["whatsapp"]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      message: "",
      scheduleType: "now",
      scheduledDate: "",
    },
  });

  const watchedMessage = form.watch("message");
  const watchedSubject = form.watch("subject");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const current = form.getValues("message");
      form.setValue("message", current + text);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.getValues("message");
    const newValue = current.substring(0, start) + text + current.substring(end);
    form.setValue("message", newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.getValues("message");
    const selectedText = current.substring(start, end);
    
    if (selectedText) {
      const newValue = current.substring(0, start) + prefix + selectedText + suffix + current.substring(end);
      form.setValue("message", newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      // No selection, insert placeholder
      const placeholder = `${prefix}text${suffix}`;
      insertAtCursor(placeholder);
    }
  };

  const handleFormat = (type: string, value?: string) => {
    switch (type) {
      case "bold":
        wrapSelection("*", "*");
        break;
      case "italic":
        wrapSelection("_", "_");
        break;
      case "strikethrough":
        wrapSelection("~", "~");
        break;
      case "code":
        wrapSelection("`", "`");
        break;
      case "link":
        if (value) insertAtCursor(value);
        break;
      case "image":
        if (value) insertAtCursor(`[Image: ${value}]`);
        break;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
  };

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedChannels(["whatsapp"]);
      setSelectedDrivers([]);
      setSelectAll(false);
      form.reset();
    }
  }, [open, form]);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const toggleDriver = (driverId: string) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverId) ? prev.filter((d) => d !== driverId) : [...prev, driverId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDrivers(mockDrivers.map((d) => d.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleSubmit = (data: CampaignFormData) => {
    onSubmit({
      ...data,
      channels: selectedChannels,
      recipients: selectedDrivers,
    });
    onOpenChange(false);
  };

  const channelOptions = [
    { id: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, color: "text-success" },
    { id: "sms", label: "SMS", icon: MessageSquare, color: "text-primary" },
    { id: "email", label: "Email", icon: Mail, color: "text-warning" },
  ];

  const messageTemplates = [
    { id: 1, name: "Job Assignment", content: "Hi {name}, you have been assigned a new job. Check your dashboard for details." },
    { id: 2, name: "Reminder", content: "Reminder: Your delivery is scheduled for today. Please confirm your availability." },
    { id: 3, name: "Safety Alert", content: "Safety notice: Please be aware of weather conditions in your area today." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Campaign Builder
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Select Channels & Recipients" : step === 2 ? "Compose Message" : "Review & Send"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Channels & Recipients */}
            {step === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Weekly Driver Update" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="mb-3 block">Select Channels</FormLabel>
                  <div className="flex gap-3">
                    {channelOptions.map((channel) => (
                      <Card
                        key={channel.id}
                        className={`flex-1 cursor-pointer transition-all ${
                          selectedChannels.includes(channel.id)
                            ? "border-primary ring-1 ring-primary"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                        onClick={() => toggleChannel(channel.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <channel.icon className={`h-8 w-8 mx-auto mb-2 ${channel.color}`} />
                          <p className="font-medium text-sm">{channel.label}</p>
                          {selectedChannels.includes(channel.id) && (
                            <CheckCircle className="h-4 w-4 text-primary mx-auto mt-2" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <FormLabel>Select Recipients</FormLabel>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer">
                        Select All ({mockDrivers.length})
                      </label>
                    </div>
                  </div>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    <div className="space-y-2">
                      {mockDrivers.map((driver) => (
                        <div
                          key={driver.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedDrivers.includes(driver.id)
                              ? "bg-primary/10"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleDriver(driver.id)}
                        >
                          <Checkbox
                            checked={selectedDrivers.includes(driver.id)}
                            onCheckedChange={() => toggleDriver(driver.id)}
                          />
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
                            {driver.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.phone}</p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {driver.communicationPreference}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedDrivers.length} recipient(s) selected
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Compose Message with Preview */}
            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compose Section */}
                <div className="space-y-4">
                  {selectedChannels.includes("email") && (
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Important update from FleetPro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div>
                    <FormLabel className="mb-2 block">Quick Templates</FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {messageTemplates.map((template) => (
                        <Badge
                          key={template.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => form.setValue("message", template.content)}
                        >
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Content</FormLabel>
                        <div className="mb-2">
                          <FormattingToolbar
                            onFormat={handleFormat}
                            onEmojiSelect={handleEmojiSelect}
                          />
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Type your message here... Use {name} for personalization. Use *bold*, _italic_, ~strikethrough~, `code`"
                            className="min-h-[120px] font-mono text-sm"
                            {...field}
                            ref={(e) => {
                              field.ref(e);
                              (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                            }}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            Variables: {"{name}"}, {"{phone}"} • Formatting: *bold* _italic_ ~strike~ `code`
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send Timing</FormLabel>
                        <div className="flex gap-3">
                          <Card
                            className={`flex-1 cursor-pointer transition-all ${
                              field.value === "now"
                                ? "border-primary ring-1 ring-primary"
                                : "border-border/50"
                            }`}
                            onClick={() => field.onChange("now")}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <Send className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">Send Now</p>
                                <p className="text-xs text-muted-foreground">Immediately</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card
                            className={`flex-1 cursor-pointer transition-all ${
                              field.value === "scheduled"
                                ? "border-primary ring-1 ring-primary"
                                : "border-border/50"
                            }`}
                            onClick={() => field.onChange("scheduled")}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <Clock className="h-5 w-5 text-warning" />
                              <div>
                                <p className="font-medium text-sm">Schedule</p>
                                <p className="text-xs text-muted-foreground">Send later</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("scheduleType") === "scheduled" && (
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Preview Section */}
                <div className="lg:border-l lg:pl-6 border-border/50">
                  <MessagePreview
                    message={watchedMessage}
                    subject={watchedSubject}
                    selectedChannels={selectedChannels}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Campaign</span>
                        <span className="font-medium">{form.getValues("name")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Channels</span>
                        <div className="flex gap-2">
                          {selectedChannels.map((ch) => (
                            <Badge key={ch} variant="outline" className="capitalize">
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Recipients</span>
                        <span className="font-medium">{selectedDrivers.length} drivers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Timing</span>
                        <span className="font-medium">
                          {form.getValues("scheduleType") === "now" ? "Send immediately" : form.getValues("scheduledDate")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                    <p className="text-sm">
                      This campaign will send <strong>{selectedChannels.length * selectedDrivers.length}</strong> messages
                      across {selectedChannels.length} channel(s)
                    </p>
                  </div>
                </div>

                {/* Final Preview */}
                <div className="lg:border-l lg:pl-6 border-border/50">
                  <MessagePreview
                    message={form.getValues("message")}
                    subject={form.getValues("subject")}
                    selectedChannels={selectedChannels}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
              >
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  variant="gradient"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && (selectedChannels.length === 0 || selectedDrivers.length === 0 || !form.getValues("name"))) ||
                    (step === 2 && !form.getValues("message"))
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" variant="gradient">
                  <Send className="h-4 w-4 mr-2" />
                  Launch Campaign
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
