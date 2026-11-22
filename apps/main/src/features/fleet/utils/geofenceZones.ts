/** Geofence colour per `category` — shared by the geofence dialog and the live map. */
export const zoneTypeColors: Record<string, string> = {
  general: "#64748b",
  depot: "#3b82f6",
  delivery: "#22c55e",
  restricted: "#ef4444",
  customer: "#8b5cf6",
  custom: "#f59e0b",
};

/** `general` is the server default when a zone is saved without a category. */
export const zoneTypeLabels: Record<string, string> = {
  general: "General",
  depot: "Depot",
  delivery: "Delivery Zone",
  restricted: "Restricted Area",
  customer: "Customer Site",
  custom: "Custom Zone",
};

/** Category free text (e.g. "Restricted Area") resolves to its known key; anything else draws as custom. */
export function zoneCategoryKey(category: string | null | undefined): string {
  const c = (category ?? "general").toLowerCase();
  return Object.keys(zoneTypeColors).find(key => c.includes(key)) ?? "custom";
}
