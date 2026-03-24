import { useMemo, useState } from "react";

import { createDefaultGeofenceForm } from "./constants";
import type {
 GeofenceEditorFormState,
 GeofenceEditorMode,
 GeofenceModalVehicle,
 GeofenceModalZone,
} from "./types";

type ValidationErrors = {
 name?: string;
};

function createZoneId() {
 return `geofence-${crypto.randomUUID()}`;
}

function zoneToDraft(zone: GeofenceModalZone): GeofenceEditorFormState {
 return {
  name: zone.name,
  category: zone.category,
  geofenceType: zone.geofenceType,
  center: zone.center,
  radiusMeters: zone.radiusMeters,
  color: zone.color,
  alertOnEntry: zone.alertOnEntry,
  alertOnExit: zone.alertOnExit,
  alertOnDwell: zone.alertOnDwell,
  dwellThresholdMinutes: zone.dwellThresholdMinutes,
  speedLimitKmh: zone.speedLimitKmh,
  scheduleEnabled: zone.scheduleEnabled,
  scheduleDays: zone.scheduleDays,
  scheduleStartTime: zone.scheduleStartTime,
  scheduleEndTime: zone.scheduleEndTime,
  assignedVehicleIds: zone.assignedVehicleIds,
 };
}

function draftToZone(draft: GeofenceEditorFormState, existingZoneId?: string): GeofenceModalZone {
 return {
  id: existingZoneId ?? createZoneId(),
  status: "ACTIVE",
  ...draft,
 };
}

export function useGeofenceModalState() {
 const [zones, setZones] = useState<GeofenceModalZone[]>([]);
 const [vehicles] = useState<GeofenceModalVehicle[]>([]);
 const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
 const [editorMode, setEditorMode] = useState<GeofenceEditorMode>(null);
 const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
 const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
 const [draft, setDraft] = useState<GeofenceEditorFormState>(() => createDefaultGeofenceForm());
 const [errors, setErrors] = useState<ValidationErrors>({});

 const activeZones = useMemo(
  () => zones.filter((zone) => zone.status === "ACTIVE"),
  [zones],
 );

 const selectedZone = useMemo(
  () => activeZones.find((zone) => zone.id === selectedZoneId) ?? null,
  [activeZones, selectedZoneId],
 );

 const pendingArchiveZone = useMemo(
  () => activeZones.find((zone) => zone.id === pendingArchiveId) ?? null,
  [activeZones, pendingArchiveId],
 );

 const isEditing = editorMode !== null;
 const isCreating = editorMode === "create";

 function resetDraft() {
  setDraft(createDefaultGeofenceForm());
  setErrors({});
 }

 function updateDraft(updates: Partial<GeofenceEditorFormState>) {
  setDraft((currentDraft) => ({ ...currentDraft, ...updates }));

  if (updates.name !== undefined && updates.name.trim()) {
   setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
  }
 }

 function startCreate() {
  resetDraft();
  setSelectedZoneId(null);
  setEditingZoneId(null);
  setEditorMode("create");
 }

 function startEdit(zone: GeofenceModalZone) {
  setDraft(zoneToDraft(zone));
  setSelectedZoneId(zone.id);
  setEditingZoneId(zone.id);
  setEditorMode("edit");
  setErrors({});
 }

 function cancelEditor() {
  setEditorMode(null);
  setEditingZoneId(null);
  resetDraft();
 }

 function saveDraft() {
  const trimmedName = draft.name.trim();

  if (!trimmedName) {
   setErrors({ name: "Zone name is required" });
   return false;
  }

  const nextZone = draftToZone({ ...draft, name: trimmedName }, editingZoneId ?? undefined);

  setZones((currentZones) => {
   if (editorMode === "edit" && editingZoneId) {
    return currentZones.map((zone) => (zone.id === editingZoneId ? nextZone : zone));
   }

   return [...currentZones, nextZone];
  });

  setSelectedZoneId(nextZone.id);
  setEditorMode(null);
  setEditingZoneId(null);
  resetDraft();

  return true;
 }

 function requestArchive(zoneId: string) {
  setPendingArchiveId(zoneId);
 }

 function closeArchiveDialog() {
  setPendingArchiveId(null);
 }

 function confirmArchive() {
  if (!pendingArchiveId) return;

  setZones((currentZones) =>
   currentZones.map((zone) =>
    zone.id === pendingArchiveId ? { ...zone, status: "ARCHIVED" } : zone,
   ),
  );

  if (selectedZoneId === pendingArchiveId) {
   setSelectedZoneId(null);
  }

  setPendingArchiveId(null);
 }

 return {
  activeZones,
  cancelEditor,
  closeArchiveDialog,
  confirmArchive,
  draft,
  editorMode,
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
 };
}
