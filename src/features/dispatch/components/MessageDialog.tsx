import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Phone, Send } from "lucide-react";

type MessageDialogProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 messageType: "whatsapp" | "sms";
}

export default function MessageDialog({ open, onOpenChange, messageType }: MessageDialogProps) {
 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Send Message to Fisayo Olaleye</DialogTitle>
     <DialogDescription>+2349238292391</DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
     {/* <div className="flex gap-2">
      <Button
       variant={messageType === "whatsapp" ? "default" : "outline-solid"}
       size="sm"
       onClick={() => setMessageType("whatsapp")}
       className="gap-2"
      >
       <MessageSquare className="h-4 w-4" />
       WhatsApp
      </Button>
      <Button
       variant={messageType === "sms" ? "default" : "outline-solid"}
       size="sm"
       onClick={() => setMessageType("sms")}
       className="gap-2"
      >
       <Phone className="h-4 w-4" />
       SMS
      </Button>
     </div> */}
     <Textarea
      placeholder={`Type your ${messageType} message...`}
      rows={4}
     />
    </div>
    <DialogFooter>
     <DialogClose asChild>
      <Button variant="outline">
       Cancel
      </Button>
     </DialogClose>
     <Button className="gap-2">
       <>
        <Send className="h-4 w-4" />
        Send {messageType === "whatsapp" ? "WhatsApp" : "SMS"}
       </>
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}
