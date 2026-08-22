import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  Activity, Brain, Inbox, Loader2,
  Mail, MessageSquare, Send, Users,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { CallInteractionModal } from "@/components/communications/CallInteractionModal";
// Import the tab components
import { DriverBehaviorTab } from "@/components/drivers/DriverBehaviorTab";
import { DriverFatigueTab } from "@/components/drivers/DriverFatigueTab";
import { DriverMessagesInbox } from "@/components/drivers/DriverMessagesInbox";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";

import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { useFonuCall } from "@/contexts/FonuCallContext";

export default function DriverManagement() {
  const [
    showInbox,
    setShowInbox,
  ] = useState(false);
  const [
    mainTab,
    setMainTab,
  ] = useState("drivers");

  // Communication state
  const [
    isCallDialogOpen,
    setIsCallDialogOpen,
  ] = useState(false);
  const [
    isMessageDialogOpen,
    setIsMessageDialogOpen,
  ] = useState(false);
  const [messageType] = useState<"sms" | "whatsapp">("whatsapp");
  const [
    messageContent,
    setMessageContent,
  ] = useState("");
  const [selectedContactName] = useState<string | undefined>();
  const [selectedContactPhone] = useState<string | undefined>();

  // Use real Fonu integration
  const sendSMS = async (..._args: any[]) => {};
  const sendWhatsApp = async (..._args: any[]) => ({ success: false });
  const isSending = false;

  // SIP call control (shared across app)
  const {
    endCall: sipEndCall, status: sipStatus, durationSeconds,
  } = useFonuCall();

  // Only auto-close dialog when call ends/fails, don't auto-open on mount
  useEffect(
    () => {
      if (sipStatus === "ended" || sipStatus === "failed") {
        const timer = setTimeout(
          setIsCallDialogOpen,
          600,
          false,
        );
        return () => clearTimeout(timer);
      }
    },
    [sipStatus],
  );

  const handleEndCall = () => {
    sipEndCall();
  };

  const handleSendMessage = async () => {
    if (!selectedContactPhone || !messageContent.trim())
      return;

    try {
      if (messageType === "whatsapp") {
        await sendWhatsApp(
          selectedContactPhone,
          selectedContactName,
          selectedContactPhone,
          messageContent,
          "Fleet Manager",
        );
      }
      else {
        await sendSMS(
          selectedContactPhone,
          selectedContactName,
          selectedContactPhone,
          messageContent,
          "Fleet Manager",
        );
      }
      setIsMessageDialogOpen(false);
      setMessageContent("");
    }
    catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Tab Navigation */}
      <Tabs
        value={mainTab}
        onValueChange={setMainTab}
        className="w-full"
      >
        <div className="flex justify-center mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger
              value="drivers"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger
              value="behavior"
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger
              value="fatigue"
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              Fatigue AI
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="drivers"
          className="mt-0 space-y-6"
        >
          {/* Top-right page actions */}
          <div className="flex justify-end gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowInbox(!showInbox)}
            >
              <Inbox className="h-4 w-4 mr-2" />
              {showInbox ? "Hide Inbox" : "Message Inbox"}
            </Button>
          </div>

          {/* Message Inbox */}
          {showInbox && (
            <DriverMessagesInbox />
          )}
        </TabsContent>

        <TabsContent
          value="behavior"
          className="mt-0"
        >
          <DriverBehaviorTab />
        </TabsContent>

        <TabsContent
          value="fatigue"
          className="mt-0"
        >
          <DriverFatigueTab />
        </TabsContent>
      </Tabs>

      {/* Call Interaction Modal */}
      <CallInteractionModal
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        contactName={selectedContactName}
        contactPhone={selectedContactPhone}
        status={sipStatus}
        durationSeconds={durationSeconds}
        onEndCall={handleEndCall}
        recordingEnabled
        onToggleRecord={(rec) => {
          console.log(
            "[Call] recording toggled",
            rec,
          );
        }}
        onSaveNote={(note) => {
          console.log(
            "[Call] note saved",
            note,
          );
          return true;
        }}
      />

      {/* Message Dialog */}
      <Dialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {messageType === "whatsapp"
                ? (
                    <MessageSquare className="h-5 w-5 text-success" />
                  )
                : (
                    <Mail className="h-5 w-5 text-primary" />
                  )}
              Send
              {" "}
              {messageType === "whatsapp" ? "WhatsApp" : "SMS"}
              {" "}
              to
              {" "}
              {selectedContactName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-white">
                {getInitials(selectedContactName)}
              </div>
              <div>
                <p className="font-medium">{selectedContactName}</p>
                <p className="text-sm text-muted-foreground">{selectedContactPhone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMessageDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
            >
              {isSending
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  )
                : (
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
  );
}
