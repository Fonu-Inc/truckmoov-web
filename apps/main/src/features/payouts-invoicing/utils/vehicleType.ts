export const VEHICLE_TYPE_OPTIONS = [
  {
    value: "all", label: "All vehicle types",
  },
  {
    value: "trailer-40t", label: "40-ton trailer",
  },
  {
    value: "truck-20t", label: "20-ton truck",
  },
  {
    value: "box-truck", label: "Box truck",
  },
  {
    value: "flatbed", label: "Flatbed",
  },
];

export function inferVehicleType(vehicleNumber: string | null): string {
  if (!vehicleNumber)
    return "unknown";
  const v = vehicleNumber.toUpperCase();
  if (v.includes("XR") || v.includes("RY") || v.includes("FH"))
    return "trailer-40t";
  if (v.includes("KN") || v.includes("TM"))
    return "truck-20t";
  if (v.includes("CL") || v.includes("MV"))
    return "box-truck";
  return "flatbed";
}
