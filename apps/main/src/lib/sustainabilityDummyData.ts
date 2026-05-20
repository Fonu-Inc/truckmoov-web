// Dummy data generators for the Sustainability dashboard.
// Used to populate charts/tables when real data is sparse.

export type DummyRange = "today" | "yesterday" | "7d" | "30d" | "90d";

const RANGE_DAYS: Record<DummyRange, number> = {
  today: 1,
  yesterday: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function seededRand(seed: number) {
  // Mulberry32
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDummyTrend(range: DummyRange) {
  const days = RANGE_DAYS[range];
  const rand = seededRand(days * 7 + 13);
  const today = new Date();
  const offset = range === "yesterday" ? 1 : 0;
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i) - offset);
    const base = 180 + rand() * 220;
    const distance = 600 + rand() * 800;
    return {
      date: d.toISOString().slice(5, 10), // MM-DD
      co2: Math.round(base * 10) / 10,
      distance: Math.round(distance),
    };
  });
}

export function getDummyFuelComposition(range: DummyRange) {
  const rand = seededRand(RANGE_DAYS[range] + 99);
  // slight variation per range
  const adj = (n: number) => Math.max(1, Math.round(n + (rand() - 0.5) * 4));
  return [
    { name: "Diesel", value: adj(18), color: "hsl(var(--destructive))" },
    { name: "Petrol", value: adj(12), color: "hsl(25 95% 53%)" },
    { name: "CNG", value: adj(6), color: "hsl(48 96% 53%)" },
    { name: "Hybrid", value: adj(5), color: "hsl(190 90% 50%)" },
    { name: "Electric", value: adj(4), color: "hsl(142 71% 45%)" },
  ];
}

const VEHICLE_NAMES = [
  "LAG-441-XR", "LAG-118-KP", "ABJ-902-AC", "PH-220-DD", "KAN-558-RS",
  "LAG-771-MM", "ABJ-330-LE", "LAG-654-VV", "PH-099-NB", "KAN-201-QQ",
];

export function getDummyVehicleRankings(range: DummyRange) {
  const days = RANGE_DAYS[range];
  const rand = seededRand(days * 11 + 3);
  return VEHICLE_NAMES.map((name, i) => {
    const distance = Math.round(50 * days + rand() * 80 * days);
    const co2PerKm = 0.18 + rand() * 0.35; // kg/km
    const co2 = Math.round(distance * co2PerKm * 10) / 10;
    return {
      id: `dummy-${i}`,
      name,
      co2,
      distance,
      co2PerKm,
    };
  }).sort((a, b) => b.co2 - a.co2);
}

const DRIVER_NAMES = [
  "Adebayo Okafor", "Chinwe Eze", "Musa Ibrahim", "Tunde Adeyemi",
  "Ifeoma Nwosu", "Bola Sanusi", "Emeka Obi", "Ngozi Lawal",
  "Yusuf Bello", "Funke Ojo",
];

export function getDummyEcoLeaderboard(range: DummyRange) {
  const days = RANGE_DAYS[range];
  const rand = seededRand(days * 17 + 5);
  return DRIVER_NAMES.map((driverName, i) => {
    const eco = Math.round(60 + rand() * 38);
    return {
      id: `dummy-driver-${i}`,
      driverName,
      eco_score: eco,
      idling_score: Math.round(50 + rand() * 50),
      acceleration_score: Math.round(50 + rand() * 50),
      speed_compliance_score: Math.round(55 + rand() * 45),
      fuel_efficiency_score: Math.round(55 + rand() * 45),
      co2_saved_kg: Math.round((20 + rand() * 180) * 10) / 10,
      total_trips: Math.round(8 + rand() * 60),
    };
  }).sort((a, b) => b.eco_score - a.eco_score);
}

const STATIONS = [
  "Ikeja Energy Hub", "Lekki FastCharge", "Abuja Central EV",
  "Port Harcourt PowerStop", "Kano GreenGrid", "Victoria Island Plaza",
];
const EV_VEHICLES = ["LAG-EV-001", "LAG-EV-014", "ABJ-EV-007", "PH-EV-022", "LAG-EV-031"];

export function getDummyChargingSessions(count = 12) {
  const rand = seededRand(count * 19 + 7);
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => {
    const start = Math.round(20 + rand() * 40);
    const end = Math.min(100, start + Math.round(30 + rand() * 50));
    const energy = Math.round((10 + rand() * 60) * 10) / 10;
    const duration = Math.round(25 + rand() * 90);
    const startedAt = new Date(now - i * 1000 * 60 * 60 * 6 - rand() * 1000 * 60 * 120);
    return {
      id: `dummy-charge-${i}`,
      vehicleName: EV_VEHICLES[i % EV_VEHICLES.length],
      charging_station: STATIONS[i % STATIONS.length],
      start_soc_percent: start,
      end_soc_percent: end,
      energy_kwh: energy,
      duration_minutes: duration,
      charging_type: i % 3 === 0 ? "DC Fast" : i % 3 === 1 ? "AC Level 2" : "AC Level 1",
      started_at: startedAt.toISOString(),
    };
  });
}
