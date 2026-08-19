import {
  CheckCheck, MessageSquare, Phone, PhoneCall, PhoneOff, Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  phone?: string;
  status: string;
};

type Message = {
  id: string;
  driverId: string;
  content: string;
  timestamp: Date;
  direction: "inbound" | "outbound";
  read: boolean;
};

type CommunicationsPanelProps = {
  drivers: Driver[];
  selectedDriverId?: string;
  onSelectDriver: (id: string) => void;
};

const mockMessages: Message[] = [
  {
    id: "m1",
    driverId: "d1",
    content: "I've arrived at the pickup location",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    direction: "inbound",
    read: true,
  },
  {
    id: "m2",
    driverId: "d1",
    content: "Great! Please confirm the cargo count before loading",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    direction: "outbound",
    read: true,
  },
  {
    id: "m3",
    driverId: "d1",
    content: "Confirmed. 25 packages loaded",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    direction: "inbound",
    read: true,
  },
  {
    id: "m4",
    driverId: "d2",
    content: "Traffic jam on Third Mainland Bridge",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    direction: "inbound",
    read: false,
  },
];

export function CommunicationsPanel({
  drivers,
  selectedDriverId,
  onSelectDriver,
}: CommunicationsPanelProps) {
  const [
    messageInput,
    setMessageInput,
  ] = useState("");
  const [
    messages,
    setMessages,
  ] = useState<Message[]>(mockMessages);
  const [
    callDialogOpen,
    setCallDialogOpen,
  ] = useState(false);
  const [
    callingDriver,
    setCallingDriver,
  ] = useState<Driver | null>(null);
  const [
    callStatus,
    setCallStatus,
  ] = useState<"ringing" | "connected" | "ended">("ringing");

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const driverMessages = messages.filter(m => m.driverId === selectedDriverId);

  const unreadCounts = drivers.reduce(
    (acc, driver) => {
      acc[driver.id] = messages.filter(
        m => m.driverId === driver.id && m.direction === "inbound" && !m.read,
      ).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedDriverId)
      return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      driverId: selectedDriverId,
      content: messageInput,
      timestamp: new Date(),
      direction: "outbound",
      read: true,
    };

    setMessages([
      ...messages,
      newMessage,
    ]);
    setMessageInput("");
    toast.success("Message sent");
  };

  const handleCallDriver = (driver: Driver) => {
    setCallingDriver(driver);
    setCallStatus("ringing");
    setCallDialogOpen(true);

    // Simulate call connecting
    setTimeout(
      () => {
        setCallStatus("connected");
      },
      2000,
    );
  };

  const handleEndCall = () => {
    setCallStatus("ended");
    setTimeout(
      () => {
        setCallDialogOpen(false);
        setCallingDriver(null);
      },
      500,
    );
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Communications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            defaultValue="messages"
            className="h-full"
          >
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger
                value="messages"
                className="flex-1"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger
                value="drivers"
                className="flex-1"
              >
                Drivers
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="messages"
              className="mt-0"
            >
              <div className="flex h-[350px]">
                {/* Driver list */}
                <div className="w-1/3 border-r border-border">
                  <ScrollArea className="h-full">
                    {drivers.map(driver => (
                      <button
                        key={driver.id}
                        onClick={() => onSelectDriver(driver.id)}
                        className={cn(
                          "w-full p-3 text-left border-b border-border hover:bg-muted/50 transition-colors",
                          selectedDriverId === driver.id && "bg-muted",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                              {driver.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[100px]">
                                {driver.name.split(" ")[0]}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {driver.status.replace(
                                  "_",
                                  " ",
                                )}
                              </p>
                            </div>
                          </div>
                          {unreadCounts[driver.id] > 0 && (
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {unreadCounts[driver.id]}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </div>

                {/* Chat area */}
                <div className="flex-1 flex flex-col">
                  {selectedDriver ? (
                    <>
                      {/* Chat header */}
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                            {selectedDriver.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{selectedDriver.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedDriver.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallDriver(selectedDriver)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Messages */}
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                          {driverMessages.map(msg => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                msg.direction === "outbound" ? "justify-end" : "justify-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-lg px-3 py-2",
                                  msg.direction === "outbound"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted",
                                )}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[10px] opacity-70">
                                    {msg.timestamp.toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                  {msg.direction === "outbound" && (
                                    <CheckCheck className="h-3 w-3 opacity-70" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-3 border-t border-border">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">Select a driver to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="drivers"
              className="mt-0 p-3"
            >
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {drivers.map(driver => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {driver.phone || "No phone number"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={driver.status === "active" ? "default" : "secondary"}
                        >
                          {driver.status.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCallDriver(driver)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            onSelectDriver(driver.id);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call Dialog */}
      <Dialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {callStatus === "ringing" && "Calling..."}
              {callStatus === "connected" && "Call Connected"}
              {callStatus === "ended" && "Call Ended"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
              {callingDriver?.name.charAt(0)}
            </div>
            <p className="text-lg font-medium">{callingDriver?.name}</p>
            <p className="text-sm text-muted-foreground">{callingDriver?.phone}</p>

            <div className="flex items-center gap-2 mt-4">
              {callStatus === "ringing" && (
                <Badge
                  variant="secondary"
                  className="animate-pulse"
                >
                  <PhoneCall className="h-3 w-3 mr-1" />
                  Ringing...
                </Badge>
              )}
              {callStatus === "connected" && (
                <Badge
                  variant="default"
                  className="bg-success"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="mt-8 rounded-full h-14 w-14"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
