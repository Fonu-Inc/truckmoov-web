import {
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

type DriverCommunicationActionsProps = {
  driverId: string;
  driverName: string;
  driverPhone: string;
  variant?: "inline" | "dropdown" | "buttons";
  size?: "sm" | "default" | "lg";
};

export function DriverCommunicationActions({
  driverId,
  driverName,
  driverPhone,
  variant = "buttons",
  size = "default",
}: DriverCommunicationActionsProps) {
  const sendSMS = async (..._args: any[]) => {};
  const sendWhatsApp = async (..._args: any[]) => {};
  const initiateCall = async (..._args: any[]): Promise<any> => null;
  const endCall = async (..._args: any[]) => {};
  const isSending = false;
  const isCalling = false;
  const [
    isMessageDialogOpen,
    setIsMessageDialogOpen,
  ] = useState(false);
  const [
    isCallDialogOpen,
    setIsCallDialogOpen,
  ] = useState(false);
  const [
    messageContent,
    setMessageContent,
  ] = useState("");
  const [
    messageType,
    setMessageType,
  ] = useState<"whatsapp" | "sms">("whatsapp");
  const [
    callStatus,
    setCallStatus,
  ] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [
    currentCallId,
    setCurrentCallId,
  ] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!messageContent.trim())
      return;

    try {
      if (messageType === "whatsapp") {
        await sendWhatsApp(
          driverId,
          driverName,
          driverPhone,
          messageContent,
          "Fleet Manager",
        );
      }
      else {
        await sendSMS(
          driverId,
          driverName,
          driverPhone,
          messageContent,
          "Fleet Manager",
        );
      }
      setMessageContent("");
      setIsMessageDialogOpen(false);
    }
    catch {
      // Error handled in hook
    }
  };

  const handleCall = async () => {
    try {
      setCallStatus("calling");
      setIsCallDialogOpen(true);
      const result = await initiateCall(
        driverId,
        driverName,
        driverPhone,
        "Fleet Manager",
      );
      if (result?.dbCallId) {
        setCurrentCallId(result.dbCallId);
        setCallStatus("connected");
      }
    }
    catch {
      setCallStatus("idle");
      setIsCallDialogOpen(false);
    }
  };

  const handleEndCall = async () => {
    if (currentCallId) {
      await endCall(currentCallId);
    }
    setCallStatus("ended");
    setTimeout(
      () => {
        setIsCallDialogOpen(false);
        setCallStatus("idle");
        setCurrentCallId(null);
      },
      1500,
    );
  };

  const handleQuickWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${driverName}, `);
    const phone = driverPhone.replace(
      /[\s\-()+]/g,
      "",
    );
    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
    );
  };

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={buttonSize}
            >
              <MoreHorizontal className={iconSize} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsMessageDialogOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2 text-success" />
              Send WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setMessageType("sms");
              setIsMessageDialogOpen(true);
            }}
            >
              <Phone className="h-4 w-4 mr-2 text-primary" />
              Send SMS
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCall}>
              <PhoneCall className="h-4 w-4 mr-2 text-warning" />
              Call Driver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleQuickWhatsApp}>
              <MessageSquare className="h-4 w-4 mr-2 text-success" />
              Open in WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message Dialog */}
        <MessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          driverName={driverName}
          driverPhone={driverPhone}
          messageType={messageType}
          setMessageType={setMessageType}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          onSend={handleSendMessage}
          isSending={isSending}
        />

        {/* Call Dialog */}
        <CallDialog
          open={isCallDialogOpen}
          onOpenChange={setIsCallDialogOpen}
          driverName={driverName}
          driverPhone={driverPhone}
          callStatus={callStatus}
          onEndCall={handleEndCall}
        />
      </>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSize,
            "text-success hover:text-success hover:bg-success/10",
          )}
          onClick={() => {
            setMessageType("whatsapp");
            setIsMessageDialogOpen(true);
          }}
          title="Send WhatsApp"
        >
          <MessageSquare className={iconSize} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSize,
            "text-primary hover:text-primary hover:bg-primary/10",
          )}
          onClick={() => {
            setMessageType("sms");
            setIsMessageDialogOpen(true);
          }}
          title="Send SMS"
        >
          <Mail className={iconSize} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSize,
            "text-warning hover:text-warning hover:bg-warning/10",
          )}
          onClick={handleCall}
          disabled={isCalling}
          title="Call Driver"
        >
          <PhoneCall className={iconSize} />
        </Button>

        <MessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          driverName={driverName}
          driverPhone={driverPhone}
          messageType={messageType}
          setMessageType={setMessageType}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          onSend={handleSendMessage}
          isSending={isSending}
        />

        <CallDialog
          open={isCallDialogOpen}
          onOpenChange={setIsCallDialogOpen}
          driverName={driverName}
          driverPhone={driverPhone}
          callStatus={callStatus}
          onEndCall={handleEndCall}
        />
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size={size}
        className="gap-2"
        onClick={() => {
          setMessageType("whatsapp");
          setIsMessageDialogOpen(true);
        }}
      >
        <MessageSquare className={`${iconSize} text-success`} />
        WhatsApp
      </Button>
      <Button
        variant="outline"
        size={size}
        className="gap-2"
        onClick={() => {
          setMessageType("sms");
          setIsMessageDialogOpen(true);
        }}
      >
        <Phone className={`${iconSize} text-primary`} />
        SMS
      </Button>
      <Button
        variant="outline"
        size={size}
        className="gap-2"
        onClick={handleCall}
        disabled={isCalling}
      >
        <PhoneCall className={`${iconSize} text-warning`} />
        Call
      </Button>

      <MessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        driverName={driverName}
        driverPhone={driverPhone}
        messageType={messageType}
        setMessageType={setMessageType}
        messageContent={messageContent}
        setMessageContent={setMessageContent}
        onSend={handleSendMessage}
        isSending={isSending}
      />

      <CallDialog
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        driverName={driverName}
        driverPhone={driverPhone}
        callStatus={callStatus}
        onEndCall={handleEndCall}
      />
    </div>
  );
}

// Message Dialog Component
function MessageDialog({
  open,
  onOpenChange,
  driverName,
  driverPhone,
  messageType,
  setMessageType,
  messageContent,
  setMessageContent,
  onSend,
  isSending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string;
  driverPhone: string;
  messageType: "whatsapp" | "sms";
  setMessageType: (type: "whatsapp" | "sms") => void;
  messageContent: string;
  setMessageContent: (content: string) => void;
  onSend: () => void;
  isSending: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Send Message to
            {driverName}
          </DialogTitle>
          <DialogDescription>{driverPhone}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={messageType === "whatsapp" ? "default" : "outline"}
              size="sm"
              onClick={() => setMessageType("whatsapp")}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant={messageType === "sms" ? "default" : "outline"}
              size="sm"
              onClick={() => setMessageType("sms")}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              SMS
            </Button>
          </div>
          <Textarea
            placeholder={`Type your ${messageType} message...`}
            value={messageContent}
            onChange={e => setMessageContent(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSend}
            disabled={!messageContent.trim() || isSending}
            className="gap-2"
          >
            {isSending
              ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                )
              : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                    {" "}
                    {messageType === "whatsapp" ? "WhatsApp" : "SMS"}
                  </>
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Call Dialog Component
function CallDialog({
  open,
  onOpenChange,
  driverName,
  driverPhone,
  callStatus,
  onEndCall,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string;
  driverPhone: string;
  callStatus: "idle" | "calling" | "connected" | "ended";
  onEndCall: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            callStatus === "calling" && "bg-warning/20 animate-pulse",
            callStatus === "connected" && "bg-success/20",
            callStatus === "ended" && "bg-muted",
          )}
          >
            <PhoneCall className={cn(
              "h-10 w-10",
              callStatus === "calling" && "text-warning",
              callStatus === "connected" && "text-success",
              callStatus === "ended" && "text-muted-foreground",
            )}
            />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{driverName}</h3>
            <p className="text-sm text-muted-foreground">{driverPhone}</p>
          </div>
          <Badge variant="secondary">
            {callStatus === "calling" && "Calling..."}
            {callStatus === "connected" && "Connected"}
            {callStatus === "ended" && "Call Ended"}
          </Badge>
          {callStatus !== "ended" && (
            <Button
              variant="destructive"
              size="lg"
              onClick={onEndCall}
              className="gap-2 mt-4"
            >
              <X className="h-4 w-4" />
              End Call
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
