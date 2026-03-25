import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type CallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CallDialog({open, onOpenChange}: CallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center py-8 space-y-4">
          {/* <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            callStatus === "calling" && "bg-warning/20 animate-pulse",
            callStatus === "connected" && "bg-success/20",
            callStatus === "ended" && "bg-muted"
          )}>
            <PhoneCall className={cn(
              "h-10 w-10",
              callStatus === "calling" && "text-warning",
              callStatus === "connected" && "text-success",
              callStatus === "ended" && "text-muted-foreground"
            )} />
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
            <Button variant="destructive" size="lg" className="gap-2 mt-4">
              <X className="h-4 w-4" />
              End Call
            </Button>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
