import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreHorizontal, Phone, PhoneCall } from "lucide-react";
import { useState } from "react";
import MessageDialog from "./MessageDialog";
import CallDialog from "./CallDialog";

export default function DriverCommunicationActions() {
 const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
 const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
 const [messageType, setMessageType] = useState<"whatsapp" | "sms">("whatsapp");


 const handleQuickWhatsApp = () => {
  // const message = encodeURIComponent(`Hello ${driverName}, `);
  // const phone = driverPhone.replace(/[\s\-\(\)\+]/g, "");
  // window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
 };

 const handleCall = async () => {
  // try {
  //  setCallStatus("calling");
  //  setIsCallDialogOpen(true);
  //  const result = await initiateCall(driverId, driverName, driverPhone, "Fleet Manager");
  //  if (result?.dbCallId) {
  //   setCurrentCallId(result.dbCallId);
  //   setCallStatus("connected");
  //  }
  // } catch (error) {
  //  setCallStatus("idle");
  //  setIsCallDialogOpen(false);
  // }
 };

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button variant="ghost" size="icon">
      <MoreHorizontal />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
     <DropdownMenuItem onClick={() => setIsMessageDialogOpen(true)}>
      <MessageSquare className="h-4 w-4 mr-2 text-success" />
      Send WhatsApp
     </DropdownMenuItem>
     <DropdownMenuItem onClick={() => { setMessageType("sms"); setIsMessageDialogOpen(true); }}>
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
    messageType={messageType}
   />

   {/* Call Dialog */}
   <CallDialog
    open={isCallDialogOpen}
    onOpenChange={setIsCallDialogOpen}
   />
  </>
 )
}
