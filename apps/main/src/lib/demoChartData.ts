/**
 * Centralized demo / fallback chart data generators.
 *
 * Used by chart components to render realistic dummy series when the
 * underlying data source returns an empty array (demo mode, fresh tenant,
 * or backend not yet seeded). Keeps every dashboard, analytics page and
 * report visually complete for demos and screenshots.
 */

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayShort = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short" });
const monthDay = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const seededRand = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

export function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

/* ============================================================
 * Fleet / Operations
 * ============================================================ */

export const demoTripsByDay = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 1);
  const completed = 18 + Math.round(r() * 18);
  return {
    name: dayShort(d),
    date: monthDay(d),
    completed,
    inProgress: 3 + Math.round(r() * 6),
    cancelled: Math.round(r() * 3),
    trips: completed,
  };
});

export const demoFleetUtilization = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 21);
  return {
    name: dayShort(d),
    day: dayShort(d),
    utilization: 65 + Math.round(r() * 25),
    target: 80,
  };
});

export const demoVehicleStatusBreakdown = [
  { name: "Active", value: 134, fill: "hsl(142 76% 36%)" },
  { name: "Idle", value: 12, fill: "hsl(48 96% 53%)" },
  { name: "Maintenance", value: 6, fill: "hsl(0 84% 60%)" },
  { name: "Offline", value: 4, fill: "hsl(220 9% 46%)" },
];

export const demoRevenueByMonth = monthLabels.slice(0, 6).map((m, i) => {
  const r = seededRand(i + 50);
  return {
    name: m,
    month: m,
    revenue: 8_500_000 + Math.round(r() * 4_500_000),
    cost: 5_200_000 + Math.round(r() * 2_500_000),
    profit: 0,
  };
}).map((row) => ({ ...row, profit: row.revenue - row.cost }));

export const demoDeliveryPerformance = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 70);
  return {
    name: dayShort(d),
    onTime: 88 + Math.round(r() * 10),
    late: 2 + Math.round(r() * 8),
  };
});

/* ============================================================
 * Fuel / Sustainability
 * ============================================================ */

export const demoFuelConsumption = lastNDays(14).map((d, i) => {
  const r = seededRand(i + 100);
  const liters = 320 + Math.round(r() * 160);
  return {
    name: monthDay(d),
    date: monthDay(d),
    liters,
    cost: liters * 750,
    efficiency: 6.5 + r() * 2,
  };
});

export const demoFuelByVehicle = [
  { name: "LAG-234-XY", consumption: 482, efficiency: 7.8 },
  { name: "LAG-567-AB", consumption: 415, efficiency: 8.2 },
  { name: "LAG-112-EF", consumption: 528, efficiency: 6.9 },
  { name: "LAG-445-GH", consumption: 392, efficiency: 8.5 },
  { name: "LAG-890-CD", consumption: 456, efficiency: 7.4 },
];

export const demoFuelAnomalies = [
  { name: "Possible theft", value: 4, fill: "hsl(0 84% 60%)" },
  { name: "Excess idling", value: 11, fill: "hsl(48 96% 53%)" },
  { name: "Aggressive driving", value: 7, fill: "hsl(25 95% 53%)" },
  { name: "Route deviation", value: 3, fill: "hsl(220 70% 55%)" },
];

export const demoEmissionsTrend = lastNDays(30).map((d, i) => {
  const r = seededRand(i + 200);
  return {
    name: monthDay(d),
    date: monthDay(d),
    co2: 220 + Math.round(r() * 180),
    target: 280,
  };
});

export const demoEcoScoreDistribution = [
  { name: "Excellent (90-100)", value: 8, fill: "hsl(142 76% 36%)" },
  { name: "Good (75-89)", value: 14, fill: "hsl(170 60% 45%)" },
  { name: "Average (60-74)", value: 9, fill: "hsl(48 96% 53%)" },
  { name: "Poor (<60)", value: 3, fill: "hsl(0 84% 60%)" },
];

/* ============================================================
 * Driver behaviour / IVR / Communications
 * ============================================================ */

export const demoDriverBehavior = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 300);
  return {
    name: dayShort(d),
    harshBraking: Math.round(r() * 8),
    harshAcceleration: Math.round(r() * 6),
    overspeeding: Math.round(r() * 5),
    cornering: Math.round(r() * 4),
  };
});

export const demoTopDrivers = [
  { name: "Chukwuemeka O.", score: 96, trips: 142 },
  { name: "Oluwaseun A.", score: 92, trips: 128 },
  { name: "Adebayo J.", score: 89, trips: 117 },
  { name: "Ibrahim M.", score: 85, trips: 109 },
  { name: "Tunde B.", score: 78, trips: 88 },
];

export const demoIVRCallStatus = [
  { name: "Answered", value: 142, fill: "hsl(142 76% 36%)" },
  { name: "Missed", value: 28, fill: "hsl(48 96% 53%)" },
  { name: "Failed", value: 9, fill: "hsl(0 84% 60%)" },
];

export const demoIVRResponse = [
  { name: "Accepted", value: 86, fill: "hsl(142 76% 36%)" },
  { name: "Declined", value: 32, fill: "hsl(0 84% 60%)" },
  { name: "No response", value: 24, fill: "hsl(220 9% 46%)" },
];

export const demoCallsByType = [
  { name: "Job offer", value: 78 },
  { name: "Status check", value: 54 },
  { name: "Emergency", value: 12 },
  { name: "Reminder", value: 35 },
];

export const demoMessageVolume = lastNDays(14).map((d, i) => {
  const r = seededRand(i + 400);
  return {
    name: monthDay(d),
    sms: 80 + Math.round(r() * 100),
    whatsapp: 140 + Math.round(r() * 180),
    voice: 20 + Math.round(r() * 40),
  };
});

/* ============================================================
 * Maintenance
 * ============================================================ */

export const demoMaintenanceCostByMonth = monthLabels.slice(0, 6).map((m, i) => {
  const r = seededRand(i + 500);
  return {
    name: m,
    month: m,
    cost: 280_000 + Math.round(r() * 350_000),
    jobs: 4 + Math.round(r() * 8),
  };
});

export const demoMaintenanceByType = [
  { name: "Preventive", value: 38, fill: "hsl(142 76% 36%)" },
  { name: "Corrective", value: 22, fill: "hsl(48 96% 53%)" },
  { name: "Inspection", value: 18, fill: "hsl(220 70% 55%)" },
  { name: "Emergency", value: 7, fill: "hsl(0 84% 60%)" },
];

/* ============================================================
 * Platform / Tenants / Billing / Security
 * ============================================================ */

export const demoTenantGrowth = monthLabels.slice(0, 12).map((m, i) => {
  const r = seededRand(i + 600);
  return {
    name: m,
    month: m,
    tenants: 12 + i * 4 + Math.round(r() * 5),
    activeUsers: 180 + i * 65 + Math.round(r() * 40),
  };
});

export const demoStakeholderMix = [
  { name: "Fleet Provider", value: 38, fill: "hsl(48 96% 53%)" },
  { name: "Enterprise", value: 22, fill: "hsl(220 70% 55%)" },
  { name: "Aggregator", value: 14, fill: "hsl(170 60% 45%)" },
  { name: "Owner-Operator", value: 41, fill: "hsl(280 65% 60%)" },
];

export const demoBillingRevenue = monthLabels.slice(0, 6).map((m, i) => {
  const r = seededRand(i + 700);
  return {
    name: m,
    month: m,
    subscription: 4_200_000 + Math.round(r() * 1_400_000),
    usage: 1_800_000 + Math.round(r() * 900_000),
  };
});

export const demoApiUsage = lastNDays(14).map((d, i) => {
  const r = seededRand(i + 800);
  return {
    name: monthDay(d),
    requests: 1200 + Math.round(r() * 2400),
    errors: Math.round(r() * 80),
  };
});

export const demoApiEndpoints = [
  { name: "/v1/vehicles", value: 4280 },
  { name: "/v1/jobs", value: 3120 },
  { name: "/v1/drivers", value: 2480 },
  { name: "/v1/telemetry", value: 8940 },
  { name: "/v1/devices", value: 1820 },
];

export const demoLoginTrend = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 900);
  return {
    name: dayShort(d),
    date: monthDay(d),
    successful: 280 + Math.round(r() * 180),
    failed: 8 + Math.round(r() * 22),
  };
});

export const demoEventsByTenant = [
  { name: "Lagos Express", logins: 412, failed: 14 },
  { name: "Accra Swift", logins: 268, failed: 22 },
  { name: "Nairobi Fleet", logins: 195, failed: 8 },
  { name: "Cape Town Trucking", logins: 142, failed: 31 },
  { name: "Johannesburg Freight", logins: 358, failed: 11 },
];

/* ============================================================
 * SIMs / Devices / Wallet / AI usage
 * ============================================================ */

export const demoSimDataUsage = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 1000);
  return {
    name: dayShort(d),
    dataMb: 420 + Math.round(r() * 360),
    activeSims: 110 + Math.round(r() * 30),
  };
});

export const demoSimStatus = [
  { name: "Active", value: 124, fill: "hsl(142 76% 36%)" },
  { name: "Suspended", value: 11, fill: "hsl(48 96% 53%)" },
  { name: "Available", value: 28, fill: "hsl(220 70% 55%)" },
  { name: "Terminated", value: 5, fill: "hsl(0 84% 60%)" },
];

export const demoDeviceTelemetry = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 1100);
  return {
    name: dayShort(d),
    speed: 35 + Math.round(r() * 45),
    fuel: 40 + Math.round(r() * 50),
    battery: 70 + Math.round(r() * 25),
  };
});

export const demoWalletUsage = lastNDays(14).map((d, i) => {
  const r = seededRand(i + 1200);
  return {
    name: monthDay(d),
    spent: 18_000 + Math.round(r() * 32_000),
    balance: 0,
  };
}).reduce<Array<{ name: string; spent: number; balance: number }>>((acc, row) => {
  const prev = acc[acc.length - 1]?.balance ?? 1_500_000;
  acc.push({ ...row, balance: prev - row.spent });
  return acc;
}, []);

export const demoAIUsage = lastNDays(14).map((d, i) => {
  const r = seededRand(i + 1300);
  return {
    name: monthDay(d),
    requests: 60 + Math.round(r() * 120),
    tokens: 14_000 + Math.round(r() * 28_000),
    cost: 12 + r() * 28,
  };
});

/* ============================================================
 * Geofence alerts
 * ============================================================ */

export const demoGeofenceAlertsTrend = lastNDays(7).map((d, i) => {
  const r = seededRand(i + 1400);
  return {
    name: dayShort(d),
    date: monthDay(d),
    entries: 8 + Math.round(r() * 14),
    exits: 6 + Math.round(r() * 12),
    dwell: Math.round(r() * 4),
  };
});

export const demoGeofenceAlertTypes = [
  { name: "Entry", value: 84, fill: "hsl(142 76% 36%)" },
  { name: "Exit", value: 62, fill: "hsl(220 70% 55%)" },
  { name: "Dwell", value: 18, fill: "hsl(48 96% 53%)" },
  { name: "Restricted", value: 9, fill: "hsl(0 84% 60%)" },
];

export const demoGeofenceTopZones = [
  { name: "Apapa Port", entries: 42, exits: 38 },
  { name: "Tin Can Island", entries: 31, exits: 29 },
  { name: "Lekki Depot", entries: 24, exits: 22 },
  { name: "Ikeja Hub", entries: 19, exits: 17 },
  { name: "Mile 2 Yard", entries: 14, exits: 12 },
];

/* ============================================================
 * Helper: pick demo data when source array is empty
 * ============================================================ */
export function withDemoFallback<T>(source: T[] | null | undefined, demo: T[]): T[] {
  if (!source || source.length === 0) return demo;
  return source;
}
