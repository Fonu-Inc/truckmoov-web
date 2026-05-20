import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Phone,
  Send,
  CheckCheck,
  Check,
  Clock,
  MapPin,
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: number;
  type: "incoming" | "outgoing";
  content: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export default function DriverInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "incoming",
      content: `🚛 *New Job Assignment #TM-2847*

📍 *Pickup:* Apapa Port, Lagos
📍 *Delivery:* Ikeja Industrial Estate
📦 *Cargo:* Electronics (8.5 tons)
💰 *Payment:* ₦185,000
🛣️ *Distance:* 28 km (~1h 15m)

Reply *1* to Accept
Reply *2* to Reject`,
      time: "9:30 AM",
      status: "read",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [activeCall, setActiveCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      type: "outgoing",
      content: inputValue,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      let response: Message;

      if (inputValue === "1") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `✅ *Job Accepted!*

You've accepted Job #TM-2847

📍 *Navigate to Pickup:*
https://maps.google.com/?q=6.4398,3.3598

⏱️ Expected arrival: 45 minutes

Reply *ARRIVED* when you reach the pickup location.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
        toast.success("Job accepted!");
      } else if (inputValue === "2") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `❌ Job #TM-2847 has been declined.

We'll notify you when new jobs are available in your area.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
        toast.info("Job declined");
      } else if (inputValue.toLowerCase() === "arrived") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `📦 *Arrival Confirmed!*

Please load the cargo and confirm when ready.

Reply *LOADED* when cargo is secured and you're ready to depart.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
      } else if (inputValue.toLowerCase() === "loaded") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `🚛 *Cargo Loaded - En Route!*

📍 *Navigate to Delivery:*
https://maps.google.com/?q=6.6018,3.3515

📍 *Destination:* Ikeja Industrial Estate
📞 *Customer Contact:* +234 801 234 5678

Reply *DELIVERED* when cargo is delivered.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
      } else if (inputValue.toLowerCase() === "delivered") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `🎉 *Delivery Complete!*

Job #TM-2847 successfully completed.

💰 *Earnings:* ₦185,000
⭐ *Rating:* Pending customer review

Thank you for your excellent service!
New jobs will be sent when available.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
        toast.success("Job completed! Earnings: ₦185,000");
      } else if (inputValue.toLowerCase() === "help") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `📋 *Available Commands:*

• *1* - Accept job
• *2* - Reject job
• *ARRIVED* - Confirm arrival at pickup
• *LOADED* - Confirm cargo loaded
• *DELIVERED* - Confirm delivery complete
• *STATUS* - Check current job status
• *SUPPORT* - Contact dispatch support
• *EARNINGS* - View today's earnings`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
      } else if (inputValue.toLowerCase() === "status") {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `📊 *Current Status:*

🚛 Active Job: #TM-2847
📍 Status: En route to delivery
⏱️ ETA: 35 minutes
💰 Pending Payment: ₦185,000`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
      } else {
        response = {
          id: messages.length + 2,
          type: "incoming",
          content: `I didn't understand that command.

Reply *HELP* for available commands.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        };
      }

      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handleCall = () => {
    setActiveCall(true);
    toast.info("Connecting to dispatch...");
    
    // Simulate call duration
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Auto end after demo
    setTimeout(() => {
      clearInterval(interval);
    }, 60000);
  };

  const handleEndCall = () => {
    setActiveCall(false);
    setCallDuration(0);
    toast.success("Call ended");
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Driver Communication Interface</h1>
          <p className="text-muted-foreground">
            Drivers interact via WhatsApp, SMS & Voice - No app installation needed
          </p>
        </div>

        <Tabs defaultValue="whatsapp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <PhoneCall className="h-4 w-4" />
              Voice/IVR
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Interface */}
          <TabsContent value="whatsapp">
            <Card className="overflow-hidden">
              <CardHeader className="bg-[#075E54] text-white py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">FleetPro Dispatch</CardTitle>
                      <p className="text-xs text-white/70">Online • Fast response</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleCall}
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-[500px] bg-[#ECE5DD] dark:bg-secondary/30 p-4 space-y-3 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.type === "outgoing" && "justify-end")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg p-3 shadow-sm",
                          msg.type === "incoming"
                            ? "bg-white dark:bg-card rounded-tl-none"
                            : "bg-[#DCF8C6] dark:bg-success/20 rounded-tr-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                          {msg.type === "outgoing" && (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
                  <Input
                    className="flex-1 rounded-full"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button
                    size="icon"
                    className="rounded-full bg-[#075E54] hover:bg-[#064940]"
                    onClick={handleSend}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Try these commands:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {["1", "2", "ARRIVED", "LOADED", "DELIVERED", "STATUS", "HELP"].map((cmd) => (
                    <Badge
                      key={cmd}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => {
                        setInputValue(cmd);
                      }}
                    >
                      {cmd}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Interface */}
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  SMS Fallback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  SMS is used automatically when WhatsApp is unavailable or for drivers who prefer text messages.
                </p>

                {/* SMS Preview */}
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Incoming SMS</Badge>
                      <span className="text-xs text-muted-foreground">From: FLEET PRO</span>
                    </div>
                    <p className="text-sm font-mono">
                      Job #TM-2847: Apapa Port to Ikeja. 8.5T Electronics. N185K. Reply 1=Accept 2=Reject
                    </p>
                  </div>

                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Outgoing SMS</Badge>
                      <span className="text-xs text-muted-foreground">To: 32100</span>
                    </div>
                    <p className="text-sm font-mono">1</p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Incoming SMS</Badge>
                    </div>
                    <p className="text-sm font-mono">
                      Job accepted! Pickup: goo.gl/maps/abc123. Reply ARRIVED when at location.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    SMS commands: 1=Accept, 2=Reject, ARRIVED, LOADED, DELIVERED, HELP
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice/IVR Interface */}
          <TabsContent value="voice">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Active Call Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-primary" />
                    Voice Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeCall ? (
                    <div className="text-center py-8">
                      <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <PhoneCall className="h-10 w-10 text-success" />
                      </div>
                      <p className="font-semibold text-lg mb-1">Connected to Dispatch</p>
                      <p className="text-2xl font-mono text-primary mb-4">
                        {formatCallDuration(callDuration)}
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" size="icon" className="rounded-full h-12 w-12">
                          <Mic className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-full h-12 w-12"
                          onClick={handleEndCall}
                        >
                          <PhoneOff className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full h-12 w-12">
                          <Volume2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Phone className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Call dispatch for urgent assistance or job inquiries
                      </p>
                      <Button className="gap-2" onClick={handleCall}>
                        <PhoneCall className="h-4 w-4" />
                        Call Dispatch
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* IVR System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-primary" />
                    IVR System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Automated voice system for quick actions when WhatsApp/SMS isn't available.
                  </p>

                  <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                    <p className="text-sm italic text-muted-foreground">
                      "Welcome to FleetPro. You have 1 new job assignment."
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      "Job details: Pickup from Apapa Port, delivery to Ikeja Industrial Estate. Payment: 185 thousand Naira."
                    </p>
                    <p className="text-sm italic font-medium">
                      "Press 1 to accept, Press 2 to reject, Press 0 to speak with dispatch."
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
                      <Button
                        key={key}
                        variant="outline"
                        className="h-12 text-lg font-semibold"
                        onClick={() => {
                          if (key === 1) toast.success("Job accepted via IVR");
                          if (key === 2) toast.info("Job rejected via IVR");
                          if (key === 0) {
                            toast.info("Connecting to dispatch...");
                            handleCall();
                          }
                        }}
                      >
                        {key}
                      </Button>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Press 1 - Accept job</p>
                    <p>• Press 2 - Reject job</p>
                    <p>• Press 3 - Hear job details again</p>
                    <p>• Press 0 - Speak with dispatch</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">No App Required</p>
                <p className="text-sm text-muted-foreground">
                  Drivers receive job notifications via WhatsApp (primary) or SMS (fallback). 
                  Navigation links open directly in Google Maps or Waze. Voice/IVR available 
                  for areas with limited data connectivity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
