import { addDays, formatDayMonth, subDays } from "@truckmoov/app-core/utils/time-utils";
import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";

const RANGE_DAYS: Record<ChartDateRange, number> = {
  today: 1,
  yesterday: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Earnings trend data points for chart, scaled by range. */
export function getDummyEarningsTrend(range: ChartDateRange) {
  const days = RANGE_DAYS[range];
  const rand = seeded(range.length * 7 + days);
  const today = new Date();
  const start = range === "yesterday" ? subDays(today, 1) : subDays(today, days - 1);

  if (range === "today" || range === "yesterday") {
    // hourly buckets across business hours
    return Array.from({ length: 8 }, (_, i) => {
      const hour = 8 + i * 2;
      return {
        label: `${hour}:00`,
        earnings: Math.round(15000 + rand() * 60000),
        trips: Math.max(1, Math.round(rand() * 4)),
      };
    });
  }
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    return {
      label: formatDayMonth(d),
      earnings: Math.round(40000 + rand() * 180000),
      trips: Math.max(1, Math.round(rand() * 6)),
    };
  });
}

/** Aggregated KPI numbers based on selected range. */
export function getDummyEarningsSummary(range: ChartDateRange) {
  const trend = getDummyEarningsTrend(range);
  const total = trend.reduce((s, d) => s + d.earnings, 0);
  const trips = trend.reduce((s, d) => s + d.trips, 0);
  const avg = trips > 0 ? Math.round(total / trips) : 0;
  return { total, trips, avg, lastMonth: Math.round(total * 0.78) };
}

export const DUMMY_VEHICLES = [
  {
    id: "oo-v1",
    registration_number: "LAG-348-OO",
    make: "Mercedes-Benz",
    model: "Actros",
    year: 2022,
    status: "active",
    current_mileage: 145320,
    capacity: 38,
    fuelLevel: 72,
    lastTrip: "Apapa → Ibadan",
  },
  {
    id: "oo-v2",
    registration_number: "LAG-771-OO",
    make: "MAN",
    model: "TGX 18.480",
    year: 2021,
    status: "active",
    current_mileage: 198650,
    capacity: 40,
    fuelLevel: 45,
    lastTrip: "Lagos → Onitsha",
  },
  {
    id: "oo-v3",
    registration_number: "LAG-902-OO",
    make: "Scania",
    model: "R450",
    year: 2023,
    status: "maintenance",
    current_mileage: 87410,
    capacity: 42,
    fuelLevel: 30,
    lastTrip: "Tin Can → Kano",
  },
];

export const DUMMY_RECENT_JOBS = [
  {
    id: "oo-j1",
    reference: "TM-9821",
    status: "in_progress",
    pickup_address: "Apapa Port, Lagos",
    delivery_address: "Sango Industrial Estate, Ibadan",
    amount_ngn: 285000,
    revenue_ngn: 285000,
    cargo_type: "Containerized goods",
    cargo_weight: 24,
    distance: 145,
    deadline: addDays(new Date(), 1).toISOString(),
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "oo-j2",
    reference: "TM-9817",
    status: "completed",
    pickup_address: "Tin Can Port, Lagos",
    delivery_address: "Aba Main Market, Aba",
    amount_ngn: 420000,
    revenue_ngn: 420000,
    cargo_type: "General cargo",
    cargo_weight: 30,
    distance: 580,
    deadline: subDays(new Date(), 2).toISOString(),
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString(),
  },
  {
    id: "oo-j3",
    reference: "TM-9805",
    status: "completed",
    pickup_address: "Lekki Free Zone, Lagos",
    delivery_address: "Bodija Market, Ibadan",
    amount_ngn: 198000,
    revenue_ngn: 198000,
    cargo_type: "Beverages",
    cargo_weight: 18,
    distance: 138,
    deadline: subDays(new Date(), 6).toISOString(),
    created_at: subDays(new Date(), 8).toISOString(),
    updated_at: subDays(new Date(), 6).toISOString(),
  },
  {
    id: "oo-j4",
    reference: "TM-9794",
    status: "completed",
    pickup_address: "Mile 2, Lagos",
    delivery_address: "Nyanya, Abuja",
    amount_ngn: 510000,
    revenue_ngn: 510000,
    cargo_type: "Building materials",
    cargo_weight: 35,
    distance: 740,
    deadline: subDays(new Date(), 10).toISOString(),
    created_at: subDays(new Date(), 13).toISOString(),
    updated_at: subDays(new Date(), 10).toISOString(),
  },
  {
    id: "oo-j5",
    reference: "TM-9780",
    status: "cancelled",
    pickup_address: "Ikeja, Lagos",
    delivery_address: "Benin City",
    amount_ngn: 250000,
    revenue_ngn: 0,
    cargo_type: "Electronics",
    cargo_weight: 12,
    distance: 320,
    deadline: subDays(new Date(), 15).toISOString(),
    created_at: subDays(new Date(), 17).toISOString(),
    updated_at: subDays(new Date(), 15).toISOString(),
  },
];

export const DUMMY_JOB_OFFERS = [
  {
    id: "oo-off1",
    job_id: "dummy-job-1",
    target_org_id: "self",
    offered_rate_ngn: 320000,
    status: "PENDING",
    created_at: subDays(new Date(), 0).toISOString(),
    expires_at: addDays(new Date(), 1).toISOString(),
    response_note: null,
    jobs: {
      id: "dummy-job-1",
      reference: "TM-9842",
      status: "offered",
      pickup_address: "Apapa Port, Lagos",
      delivery_address: "Kano Central Market, Kano",
      cargo_type: "Containerized FMCG",
      cargo_weight: 28,
      amount_ngn: 320000,
      deadline: addDays(new Date(), 3).toISOString(),
      created_at: new Date().toISOString(),
    },
    organizations: { id: "ent1", name: "Dangote Logistics" },
  },
  {
    id: "oo-off2",
    job_id: "dummy-job-2",
    target_org_id: "self",
    offered_rate_ngn: 180000,
    status: "PENDING",
    created_at: subDays(new Date(), 0).toISOString(),
    expires_at: addDays(new Date(), 0).toISOString(),
    response_note: null,
    jobs: {
      id: "dummy-job-2",
      reference: "TM-9841",
      status: "offered",
      pickup_address: "Lekki Free Zone, Lagos",
      delivery_address: "Sagamu Industrial Park, Ogun",
      cargo_type: "Building materials",
      cargo_weight: 22,
      amount_ngn: 180000,
      deadline: addDays(new Date(), 2).toISOString(),
      created_at: subDays(new Date(), 0).toISOString(),
    },
    organizations: { id: "ent2", name: "BUA Cement" },
  },
  {
    id: "oo-off3",
    job_id: "dummy-job-3",
    target_org_id: "self",
    offered_rate_ngn: 245000,
    status: "ACCEPTED",
    created_at: subDays(new Date(), 2).toISOString(),
    expires_at: subDays(new Date(), 1).toISOString(),
    responded_at: subDays(new Date(), 2).toISOString(),
    response_note: "Accepted via WhatsApp.",
    jobs: {
      id: "dummy-job-3",
      reference: "TM-9830",
      status: "assigned",
      pickup_address: "Tin Can Port, Lagos",
      delivery_address: "Onitsha Main Market, Anambra",
      cargo_type: "General cargo",
      cargo_weight: 30,
      amount_ngn: 245000,
      deadline: subDays(new Date(), 0).toISOString(),
      created_at: subDays(new Date(), 2).toISOString(),
    },
    organizations: { id: "ent3", name: "Flour Mills of Nigeria" },
  },
  {
    id: "oo-off4",
    job_id: "dummy-job-4",
    target_org_id: "self",
    offered_rate_ngn: 130000,
    status: "DECLINED",
    created_at: subDays(new Date(), 4).toISOString(),
    expires_at: subDays(new Date(), 3).toISOString(),
    responded_at: subDays(new Date(), 4).toISOString(),
    response_note: "Truck on another route.",
    jobs: {
      id: "dummy-job-4",
      reference: "TM-9818",
      status: "pending",
      pickup_address: "Ikeja, Lagos",
      delivery_address: "Akure Central, Ondo",
      cargo_type: "Beverages",
      cargo_weight: 14,
      amount_ngn: 130000,
      deadline: subDays(new Date(), 1).toISOString(),
      created_at: subDays(new Date(), 4).toISOString(),
    },
    organizations: { id: "ent4", name: "Nigerian Breweries" },
  },
];



