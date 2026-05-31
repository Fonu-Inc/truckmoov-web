/**
 * Frontend-only demo / fallback data for fleet-domain tables.
 *
 * Used by data hooks (useFuelTransactions, useMaintenanceRecords,
 * useComplianceDocuments, etc.) to render realistic dummy rows when the
 * backend returns an empty array. Pure UI fallback — never written to DB.
 */

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const dateOnly = (offsetDays: number) =>
  new Date(now + offsetDays * day).toISOString().split("T")[0];

/* ============================================================
 * Fuel Transactions
 * ============================================================ */
export interface DemoFuelTransaction {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string;
  driver_name: string | null;
  fuel_type: string;
  quantity_liters: number;
  cost_ngn: number;
  odometer_reading: number | null;
  station_name: string | null;
  location: string | null;
  transaction_date: string;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const fuelSeed: Array<Omit<DemoFuelTransaction, "id" | "tenant_id" | "created_at" | "updated_at" | "transaction_date"> & { offsetH: number }> = [
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", driver_name: "Chukwuemeka Okafor", fuel_type: "diesel", quantity_liters: 180.5, cost_ngn: 144400, odometer_reading: 152340, station_name: "Mobil Ikorodu Rd", location: "Lagos", receipt_number: "RCT-3001", notes: "Routine top-up", offsetH: -1 },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", driver_name: "Oluwaseun Adeleke", fuel_type: "diesel", quantity_liters: 220.0, cost_ngn: 178200, odometer_reading: 98450, station_name: "Total Wuse II", location: "Abuja", receipt_number: "RCT-3002", notes: "Long haul Abuja-Kano", offsetH: -5 },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", driver_name: "Adebayo Johnson", fuel_type: "petrol", quantity_liters: 75.2, cost_ngn: 64672, odometer_reading: 45120, station_name: "NNPC Lekki", location: "Lagos", receipt_number: "RCT-3003", notes: null, offsetH: -8 },
  { vehicle_id: "v5", vehicle_name: "LAG-445-GH", driver_name: "Ibrahim Musa", fuel_type: "diesel", quantity_liters: 195.0, cost_ngn: 156000, odometer_reading: 210560, station_name: "Conoil Port Harcourt", location: "Port Harcourt", receipt_number: "RCT-3004", notes: "Delivery to refinery", offsetH: -24 },
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", driver_name: "Chukwuemeka Okafor", fuel_type: "diesel", quantity_liters: 160.0, cost_ngn: 128000, odometer_reading: 153100, station_name: "Oando Apapa", location: "Lagos", receipt_number: "RCT-3005", notes: null, offsetH: -28 },
  { vehicle_id: "v3", vehicle_name: "LAG-890-CD", driver_name: "Tunde Bakare", fuel_type: "diesel", quantity_liters: 240.0, cost_ngn: 196800, odometer_reading: 87320, station_name: "AP Kano", location: "Kano", receipt_number: "RCT-3006", notes: "Cross-country dispatch", offsetH: -48 },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", driver_name: "Adebayo Johnson", fuel_type: "petrol", quantity_liters: 65.0, cost_ngn: 55250, odometer_reading: 33420, station_name: "Mobil Victoria Island", location: "Lagos", receipt_number: "RCT-3007", notes: null, offsetH: -51 },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", driver_name: "Oluwaseun Adeleke", fuel_type: "diesel", quantity_liters: 175.5, cost_ngn: 140400, odometer_reading: 67200, station_name: "Total Ibadan", location: "Ibadan", receipt_number: "RCT-3008", notes: "Fleet refuel", offsetH: -72 },
  { vehicle_id: "v5", vehicle_name: "LAG-445-GH", driver_name: "Ibrahim Musa", fuel_type: "diesel", quantity_liters: 210.0, cost_ngn: 168000, odometer_reading: 211400, station_name: "NNPC Garki", location: "Abuja", receipt_number: "RCT-3009", notes: null, offsetH: -78 },
  { vehicle_id: "v3", vehicle_name: "LAG-890-CD", driver_name: "Tunde Bakare", fuel_type: "petrol", quantity_liters: 80.0, cost_ngn: 68800, odometer_reading: 88100, station_name: "Forte Oil Yaba", location: "Lagos", receipt_number: "RCT-3010", notes: "Detour fuelling", offsetH: -96 },
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", driver_name: "Chukwuemeka Okafor", fuel_type: "diesel", quantity_liters: 150.0, cost_ngn: 120000, odometer_reading: 153700, station_name: "Mobil Enugu", location: "Enugu", receipt_number: "RCT-3011", notes: null, offsetH: -120 },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", driver_name: "Adebayo Johnson", fuel_type: "diesel", quantity_liters: 185.0, cost_ngn: 148000, odometer_reading: 46200, station_name: "Total PH Mile 4", location: "Port Harcourt", receipt_number: "RCT-3012", notes: "Top-up", offsetH: -144 },
];

export const demoFuelTransactions: DemoFuelTransaction[] = fuelSeed.map((row, i) => ({
  ...row,
  id: `demo-fuel-${i + 1}`,
  tenant_id: "demo",
  transaction_date: iso(row.offsetH * 60 * 60 * 1000),
  created_at: iso(row.offsetH * 60 * 60 * 1000),
  updated_at: iso(row.offsetH * 60 * 60 * 1000),
}));

/* ============================================================
 * Maintenance Records
 * ============================================================ */
export interface DemoMaintenanceRecord {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  cost_ngn: number | null;
  technician: string | null;
  notes: string | null;
  priority: string;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

const maintSeed: Array<Partial<DemoMaintenanceRecord> & { offsetD: number }> = [
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", maintenance_type: "preventive", status: "scheduled", priority: "medium", category: "Oil Change",     cost_ngn: 45000,  technician: "Femi's Auto Garage",   notes: "5,000 km service interval",      offsetD: 3 },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", maintenance_type: "corrective", status: "in_progress", priority: "high",  category: "Brake Service",  cost_ngn: 120000, technician: "Apex Motors",          notes: "Front brake pads worn",          offsetD: 0 },
  { vehicle_id: "v3", vehicle_name: "LAG-890-CD", maintenance_type: "corrective", status: "overdue",   priority: "critical", category: "Engine Tune-Up", cost_ngn: 280000, technician: "Diesel Pro Workshop",   notes: "Engine warning light, low compression", offsetD: -5 },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", maintenance_type: "preventive", status: "completed",  priority: "low",   category: "Tire Rotation",  cost_ngn: 25000,  technician: "Quick Tyre Centre",     notes: "All four tires rotated",         offsetD: -7, },
  { vehicle_id: "v5", vehicle_name: "LAG-445-GH", maintenance_type: "inspection", status: "scheduled",  priority: "medium",category: "Annual Inspection", cost_ngn: 60000, technician: "VIO Inspection",       notes: "Annual roadworthiness",          offsetD: 7 },
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", maintenance_type: "preventive", status: "completed",  priority: "medium",category: "Oil Change",      cost_ngn: 42000,  technician: "Femi's Auto Garage",   notes: "Synthetic oil",                  offsetD: -30 },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", maintenance_type: "corrective", status: "completed",  priority: "high",  category: "Suspension",      cost_ngn: 95000,  technician: "Apex Motors",          notes: "Replaced front shock absorbers", offsetD: -14 },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", maintenance_type: "preventive", status: "scheduled",  priority: "low",   category: "Battery Check",   cost_ngn: 18000,  technician: "Battery Hub",          notes: "Battery health diagnostic",       offsetD: 14 },
];

export const demoMaintenanceRecords: DemoMaintenanceRecord[] = maintSeed.map((row, i) => ({
  id: `demo-maint-${i + 1}`,
  tenant_id: "demo",
  vehicle_id: row.vehicle_id!,
  vehicle_name: row.vehicle_name!,
  maintenance_type: row.maintenance_type!,
  status: row.status!,
  scheduled_date: dateOnly(row.offsetD),
  completed_date: row.status === "completed" ? dateOnly(row.offsetD) : null,
  cost_ngn: row.cost_ngn ?? null,
  technician: row.technician ?? null,
  notes: row.notes ?? null,
  priority: row.priority!,
  category: row.category ?? null,
  created_at: iso(row.offsetD * day - day),
  updated_at: iso(row.offsetD * day - day),
}));

/* ============================================================
 * Compliance Documents
 * ============================================================ */
export interface DemoComplianceDocument {
  id: string;
  tenant_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  document_type: string;
  document_name: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string;
  status: string;
  file_path: string | null;
  reminder_days: number;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const complianceSeed: Array<Partial<DemoComplianceDocument> & { expiresInDays: number }> = [
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", document_type: "insurance",       document_name: "Comprehensive Insurance",       document_number: "AIICO-2024-1011", expiresInDays: 95,  notes: "Renewed in Jan" },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", document_type: "roadworthiness",  document_name: "Vehicle Roadworthiness",        document_number: "VIO-2024-887",    expiresInDays: 18,  notes: "Renewal needed" },
  { vehicle_id: "v3", vehicle_name: "LAG-890-CD", document_type: "registration",    document_name: "Vehicle Registration (Hackney)",document_number: "FRSC-2024-2311",  expiresInDays: -10, notes: "Expired — block from dispatch" },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", document_type: "insurance",       document_name: "Third-Party Insurance",         document_number: "AXA-2024-4421",   expiresInDays: 220, notes: null },
  { vehicle_id: "v5", vehicle_name: "LAG-445-GH", document_type: "permit",          document_name: "Inter-State Haulage Permit",    document_number: "PERM-2024-559",   expiresInDays: 60,  notes: null },
  { vehicle_id: "v1", vehicle_name: "LAG-234-XY", document_type: "roadworthiness",  document_name: "Vehicle Roadworthiness",        document_number: "VIO-2024-901",    expiresInDays: 150, notes: null },
  { vehicle_id: "v4", vehicle_name: "LAG-112-EF", document_type: "permit",          document_name: "Hazardous Goods Permit",        document_number: "HAZ-2024-091",    expiresInDays: 8,   notes: "Expiring this week" },
  { vehicle_id: "v2", vehicle_name: "LAG-567-AB", document_type: "registration",    document_name: "Vehicle Registration",          document_number: "FRSC-2024-2998",  expiresInDays: 310, notes: null },
];

const computeStatus = (expiresInDays: number) => {
  if (expiresInDays < 0) return "expired";
  if (expiresInDays <= 30) return "expiring";
  return "valid";
};

export const demoComplianceDocuments: DemoComplianceDocument[] = complianceSeed.map((row, i) => ({
  id: `demo-compliance-${i + 1}`,
  tenant_id: "demo",
  vehicle_id: row.vehicle_id ?? null,
  vehicle_name: row.vehicle_name ?? null,
  document_type: row.document_type!,
  document_name: row.document_name!,
  document_number: row.document_number ?? null,
  issue_date: dateOnly(row.expiresInDays - 365),
  expiry_date: dateOnly(row.expiresInDays),
  status: computeStatus(row.expiresInDays),
  file_path: null,
  reminder_days: 30,
  reminder_sent: false,
  notes: row.notes ?? null,
  created_at: iso(-365 * day),
  updated_at: iso(-30 * day),
}));



