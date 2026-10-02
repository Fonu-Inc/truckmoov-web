export const CARGO_CATEGORIES = [
  "Electronics",
  "Food & Beverage",
  "Textiles",
  "Machinery",
  "Building materials",
  "Automotive",
  "Chemicals",
  "Pharmaceuticals",
  "Documents",
  "Furniture",
  "Agricultural",
  "Other",
] as const;

export const CARGO_UNITS = [
  "kg",
  "tons",
  "lbs",
  "cbm",
  "pallets",
  "boxes",
] as const;

export const VEHICLE_TYPES = [
  "Any Available Vehicle",
  "Pickup Truck",
  "Van",
  "Truck",
  "Trailer",
  "Container Truck",
  "Refrigerated Truck",
  "Flatbed",
  "Tanker",
] as const;

export const SPECIAL_HANDLING = [
  "Fragile",
  "Refrigerated",
  "Frozen",
  "Hazardous",
  "Perishable",
  "Oversized",
  "Live cargo",
  "High value",
  "Other",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Crane",
  "Forklift",
  "Pallet jack",
  "Straps",
  "Tarpaulin",
  "Chains",
  "Refrigeration",
  "Loading dock",
  "Other",
] as const;

export const MAX_FILE_BYTES = 3 * 1024 * 1024;

export const ANY_VEHICLE_TYPE = "Any Available Vehicle";

/** Units that are not weights: the number typed is stored as given. */
export const NON_WEIGHT_UNITS: readonly string[] = [
  "cbm",
  "pallets",
  "boxes",
];
