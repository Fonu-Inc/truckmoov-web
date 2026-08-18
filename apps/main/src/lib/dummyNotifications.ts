import type { PlatformNotification } from "@/hooks/useRealtimeNotifications";

type Stakeholder
  = | "PLATFORM_ADMIN"
    | "ENTERPRISE"
    | "FLEET_PROVIDER"
    | "AGGREGATOR"
    | "OWNER_OPERATOR"
    | "SUPERVISOR"
    | "DISPATCHER";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

function make(
  id: string,
  type: PlatformNotification["type"],
  severity: PlatformNotification["severity"],
  title: string,
  message: string,
  minsAgo: number,
  read = false,
): PlatformNotification {
  return {
    id, type, severity, title, message,
    timestamp: minutesAgo(minsAgo),
    read,
  };
}

export function getDummyNotificationsForStakeholder(
  stakeholder: Stakeholder,
): PlatformNotification[] {
  switch (stakeholder) {
    case "PLATFORM_ADMIN":
      return [
        make(
          "pa-1",
          "tenant_created",
          "success",
          "New Tenant Onboarded",
          "Lagos Express Logistics completed KYC and is now active.",
          5,
        ),
        make(
          "pa-2",
          "security",
          "error",
          "Suspicious Login Attempt",
          "5 failed logins from IP 102.89.34.12 — IP auto-blocked.",
          22,
        ),
        make(
          "pa-3",
          "sim_activated",
          "info",
          "Bulk SIM Activation",
          "120 IoT SIMs activated for MTN Fleet Co.",
          60,
          true,
        ),
        make(
          "pa-4",
          "payment",
          "success",
          "Wallet Top-up Received",
          "₦2,500,000 funded by Sahara Logistics.",
          180,
          true,
        ),
        make(
          "pa-5",
          "system",
          "warning",
          "Edge Function Latency High",
          "fonu-webhook avg latency exceeded 800ms.",
          240,
          true,
        ),
      ];

    case "ENTERPRISE":
      return [
        make(
          "ent-1",
          "alert",
          "info",
          "Shipment Delivered",
          "SHP-2041 — delivery confirmed at Apapa Terminal.",
          8,
        ),
        make(
          "ent-2",
          "alert",
          "warning",
          "Delivery Delayed",
          "SHP-2038 running 45 mins behind schedule.",
          35,
        ),
        make(
          "ent-3",
          "payment",
          "info",
          "New Invoice Generated",
          "Invoice INV-0921 for ₦780,000 ready to review.",
          120,
          true,
        ),
        make(
          "ent-4",
          "system",
          "info",
          "Provider Bid Received",
          "Sahara Logistics bid ₦620,000 on RFQ-117.",
          200,
          true,
        ),
        make(
          "ent-5",
          "alert",
          "success",
          "POD Uploaded",
          "Proof of delivery uploaded for SHP-2035.",
          320,
          true,
        ),
      ];

    case "FLEET_PROVIDER":
      return [
        make(
          "fp-1",
          "alert",
          "warning",
          "Vehicle Geofence Exit",
          "TRK-204 left Lagos depot zone.",
          4,
        ),
        make(
          "fp-2",
          "device_provisioned",
          "success",
          "New Device Online",
          "GT06-998812 reporting telemetry.",
          18,
        ),
        make(
          "fp-3",
          "alert",
          "error",
          "Harsh Braking Detected",
          "Driver Adewale Musa flagged on TRK-117.",
          40,
        ),
        make(
          "fp-4",
          "system",
          "info",
          "Maintenance Due",
          "TRK-209 service interval reached (15,000 km).",
          150,
          true,
        ),
        make(
          "fp-5",
          "payment",
          "success",
          "Settlement Paid",
          "Weekly driver settlement ₦1.2M processed.",
          360,
          true,
        ),
      ];

    case "AGGREGATOR":
      return [
        make(
          "agg-1",
          "alert",
          "info",
          "New Member Application",
          "TopGear Haulage requested to join your network.",
          12,
        ),
        make(
          "agg-2",
          "alert",
          "warning",
          "Job Reassignment Needed",
          "RFQ-204 declined by 2 members — reassign?",
          30,
        ),
        make(
          "agg-3",
          "payment",
          "success",
          "Commission Paid",
          "Network commission ₦340,000 credited.",
          95,
          true,
        ),
        make(
          "agg-4",
          "system",
          "info",
          "Member KYC Renewed",
          "Sahara Logistics renewed compliance docs.",
          220,
          true,
        ),
      ];

    case "OWNER_OPERATOR":
      return [
        make(
          "oo-1",
          "alert",
          "info",
          "New Job Offer",
          "MTN Logistics offered ₦320,000 — Lagos → Ibadan.",
          3,
        ),
        make(
          "oo-2",
          "alert",
          "warning",
          "Vehicle Insurance Expiring",
          "TRK-OO-01 insurance expires in 7 days.",
          60,
        ),
        make(
          "oo-3",
          "payment",
          "success",
          "Payout Received",
          "₦450,000 deposited to your wallet.",
          180,
          true,
        ),
        make(
          "oo-4",
          "system",
          "info",
          "WhatsApp Linked",
          "Your WhatsApp number is verified for job offers.",
          720,
          true,
        ),
        make(
          "oo-5",
          "alert",
          "success",
          "Job Completed",
          "JOB-1188 marked completed — POD received.",
          1440,
          true,
        ),
      ];

    case "SUPERVISOR":
      return [
        make(
          "sup-1",
          "alert",
          "error",
          "Critical Alert",
          "Driver fatigue score >85 on TRK-117.",
          6,
        ),
        make(
          "sup-2",
          "alert",
          "warning",
          "Geofence Breach",
          "TRK-204 exited authorized zone.",
          25,
        ),
        make(
          "sup-3",
          "alert",
          "info",
          "Shift Started",
          "Driver Adewale Musa clocked in.",
          95,
          true,
        ),
        make(
          "sup-4",
          "system",
          "info",
          "Daily Report Ready",
          "Yesterday's ops summary is available.",
          600,
          true,
        ),
      ];

    case "DISPATCHER":
      return [
        make(
          "dis-1",
          "alert",
          "info",
          "New Job Assigned",
          "JOB-2204 awaiting driver assignment.",
          2,
        ),
        make(
          "dis-2",
          "alert",
          "warning",
          "Driver Unreachable",
          "No GPS signal from TRK-301 for 12 mins.",
          18,
        ),
        make(
          "dis-3",
          "alert",
          "success",
          "Job Accepted",
          "Driver accepted JOB-2199 via WhatsApp.",
          65,
          true,
        ),
        make(
          "dis-4",
          "system",
          "info",
          "Route Optimized",
          "AI saved 38 km on today's dispatch plan.",
          240,
          true,
        ),
      ];

    default:
      return [];
  }
}

export function resolveStakeholderForNotifications(opts: {
  userRole?: string | null;
  orgType?: string | null;
}): Stakeholder {
  if (opts.userRole === "platform_admin")
    return "PLATFORM_ADMIN";
  if (opts.userRole === "supervisor")
    return "SUPERVISOR";
  if (opts.userRole === "dispatcher")
    return "DISPATCHER";
  switch (opts.orgType) {
    case "ENTERPRISE": return "ENTERPRISE";
    case "FLEET_PROVIDER": return "FLEET_PROVIDER";
    case "AGGREGATOR": return "AGGREGATOR";
    case "OWNER_OPERATOR": return "OWNER_OPERATOR";
  }
  return "FLEET_PROVIDER";
}
