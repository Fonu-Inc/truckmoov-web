import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArchiveGeofenceDialogProps {
 onConfirm: () => void;
 onOpenChange: (open: boolean) => void;
 open: boolean;
 zoneName?: string;
}

export function ArchiveGeofenceDialog({
 onConfirm,
 onOpenChange,
 open,
 zoneName,
}: ArchiveGeofenceDialogProps) {
 return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
   <AlertDialogContent>
    <AlertDialogHeader>
     <AlertDialogTitle>Archive Geofence?</AlertDialogTitle>
     <AlertDialogDescription>
      {zoneName
       ? `${zoneName} will be archived and removed from the active list until archived zones are supported in the main app.`
       : "This geofence will be archived and removed from the active list until archived zones are supported in the main app."}
     </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
     <AlertDialogCancel>Cancel</AlertDialogCancel>
     <AlertDialogAction
      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      onClick={onConfirm}
     >
      Archive
     </AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 );
}
