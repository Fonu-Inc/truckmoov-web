import { useState } from "react";
import { MapPin, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

import { ArchiveGeofenceDialog } from "./ArchiveGeofenceDialog";
import { GeofenceDetailsPanel } from "./GeofenceDetailsPanel";
import { GeofenceEditorPanel } from "./GeofenceEditorPanel";
import { GeofenceListPanel } from "./GeofenceListPanel";
import { useGeofenceModalState } from "./geofence-modal/useGeofenceModalState";

export default function GeofenceModal() {
 const [open, setOpen] = useState(false);
 const {
  activeZones,
  cancelEditor,
  closeArchiveDialog,
  confirmArchive,
  draft,
  errors,
  isCreating,
  isEditing,
  pendingArchiveZone,
  requestArchive,
  saveDraft,
  selectedZone,
  selectedZoneId,
  setSelectedZoneId,
  startCreate,
  startEdit,
  updateDraft,
  vehicles,
 } = useGeofenceModalState();

 return (
  <>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
     <Button variant="outline">
      <MapPin className="h-4 w-4" />
      Geofences
     </Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
     <DialogHeader className="p-6 pb-0">
      <DialogTitle className="flex items-center gap-2">
       <Shield className="h-5 w-5 text-primary" />
       Geofence Management
      </DialogTitle>
      <DialogDescription>
       Create, edit, and configure geofence zones with custom alerts
      </DialogDescription>
     </DialogHeader>

     <div className="flex h-[600px]">
      <GeofenceListPanel
       isEditing={isEditing}
       onCreateNew={startCreate}
       onEditZone={startEdit}
       onRequestArchive={requestArchive}
       onSelectZone={setSelectedZoneId}
       selectedZoneId={selectedZoneId}
       zones={activeZones}
      />

      <div className="flex-1 flex flex-col">
       {isEditing ? (
        <GeofenceEditorPanel
         errors={errors}
         form={draft}
         isCreating={isCreating}
         onCancel={cancelEditor}
         onSave={saveDraft}
         onUpdateForm={updateDraft}
         title={draft.name}
         vehicles={vehicles}
        />
       ) : selectedZone ? (
        <GeofenceDetailsPanel
         onEditZone={startEdit}
         vehicles={vehicles}
         zone={selectedZone}
        />
       ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
         <div>
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">Select a Geofence</h3>
          <p className="text-sm text-muted-foreground">
           Choose a zone from the list to view details
          </p>
         </div>
        </div>
       )}
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <ArchiveGeofenceDialog
    open={!!pendingArchiveZone}
    onOpenChange={(nextOpen) => {
     if (!nextOpen) {
      closeArchiveDialog();
     }
    }}
    onConfirm={confirmArchive}
    zoneName={pendingArchiveZone?.name}
   />
  </>
 );
}
