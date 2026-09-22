/**
 * Local stand-in data for the Communications pages.
 *
 * The notify endpoints (`/notify/whatsapp/*`) exist, but they are scoped to
 * tenant-side roles — dev-api answers a platform admin with 403 "dispatcher
 * role required" / "administrator role required". No admin user can load them,
 * so these pages render from here and make no network calls at all.
 *
 * Types are declared locally on purpose: importing them from
 * `@truckmoov/api/notification` would imply this app talks to that module.
 * Delete this file and both its imports when admin gets real endpoints.
 */

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export type DemoAccount = {
  business_account_id: string;
  business_name: string;
  verified_name: string;
  display_phone_number: string;
  phone_number_id: string;
  connected_at: string;
  webhook_subscribed_at: string | null;
};

export type DemoTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
};

export type DemoConversation = {
  id: string;
  driver_name: string;
  driver_phone: string;
  last_message_preview: string;
  last_message_at: string;
  is_locked: boolean;
  window_remaining_hours?: number;
};

export type DemoMessage = {
  id: string;
  direction: "inbound" | "outbound";
  status: string;
  text: string;
  created_at: string;
};

export const DEMO_ACCOUNT: DemoAccount = {
  business_account_id: "1029384756102938",
  business_name: "Telconix Limited",
  verified_name: "FleetPro Fleet",
  display_phone_number: "+234 801 000 0000",
  phone_number_id: "1234567890",
  connected_at: daysAgo(96),
  webhook_subscribed_at: daysAgo(96),
};

/** Status mix covers every tone in the page's TEMPLATE_STATUS_TONE map. */
export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "demo-1", name: "job_offer_notification", language: "en", category: "UTILITY", status: "APPROVED",
  },
  {
    id: "demo-2", name: "delivery_confirmation", language: "en", category: "UTILITY", status: "APPROVED",
  },
  {
    id: "demo-3", name: "monthly_promo_blast", language: "en_US", category: "MARKETING", status: "PENDING",
  },
  {
    id: "demo-4", name: "otp_verification", language: "en", category: "AUTHENTICATION", status: "APPROVED",
  },
  {
    id: "demo-5", name: "trip_completed_summary", language: "en", category: "UTILITY", status: "APPROVED",
  },
  {
    id: "demo-6", name: "payment_reminder", language: "en", category: "UTILITY", status: "REJECTED",
  },
  {
    id: "demo-7", name: "driver_shift_reminder", language: "en_GB", category: "UTILITY", status: "PAUSED",
  },
  {
    id: "demo-8", name: "weekend_special_offer", language: "en_US", category: "MARKETING", status: "APPROVED",
  },
];

/**
 * `demo-grace` is deliberately locked — it is what makes the closed-window
 * branch of the composer reachable.
 */
export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "demo-chukwuemeka",
    driver_name: "Chukwuemeka Okafor",
    driver_phone: "+234 801 234 5678",
    last_message_preview: "I have arrived at the Ikeja delivery point. Waiting for the receiving team.",
    last_message_at: minutesAgo(4),
    is_locked: false,
    window_remaining_hours: 23,
  },
  {
    id: "demo-amina",
    driver_name: "Amina Yusuf",
    driver_phone: "+234 803 774 2190",
    last_message_preview: "Update received. Continue safely and let us know when you arrive.",
    last_message_at: minutesAgo(34),
    is_locked: false,
    window_remaining_hours: 21,
  },
  {
    id: "demo-tunde",
    driver_name: "Tunde Akinwale",
    driver_phone: "+234 805 118 6042",
    last_message_preview: "Vehicle LA-458-KJA has been refuelled. Receipt has been submitted.",
    last_message_at: minutesAgo(96),
    is_locked: false,
    window_remaining_hours: 17,
  },
  {
    id: "demo-grace",
    driver_name: "Grace Eze",
    driver_phone: "+234 809 442 7713",
    last_message_preview: "Delivery completed successfully. The proof of delivery has been uploaded.",
    last_message_at: minutesAgo(185),
    is_locked: true,
  },
];

/** Status mix (read / delivered / sent) exercises each tick icon. */
export const DEMO_MESSAGES: Record<string, DemoMessage[]> = {
  "demo-chukwuemeka": [
    {
      id: "demo-msg-3",
      direction: "outbound",
      status: "delivered",
      text: "Trip FP-2048 has been assigned. Pickup is scheduled for 10:30 AM in Apapa.",
      created_at: minutesAgo(52),
    },
    {
      id: "demo-msg-2",
      direction: "outbound",
      status: "read",
      text: "Thank you. Please upload the signed delivery note once unloading is complete.",
      created_at: minutesAgo(11),
    },
    {
      id: "demo-msg-1",
      direction: "inbound",
      status: "read",
      text: "I have arrived at the Ikeja delivery point. Waiting for the receiving team.",
      created_at: minutesAgo(4),
    },
  ],
  "demo-amina": [
    {
      id: "demo-msg-4",
      direction: "inbound",
      status: "read",
      text: "Traffic is heavy around Third Mainland Bridge. My ETA is now 3:20 PM.",
      created_at: minutesAgo(38),
    },
    {
      id: "demo-msg-5",
      direction: "outbound",
      status: "read",
      text: "Update received. Continue safely and let us know when you arrive.",
      created_at: minutesAgo(34),
    },
  ],
  "demo-tunde": [
    {
      id: "demo-msg-6",
      direction: "inbound",
      status: "read",
      text: "Vehicle LA-458-KJA has been refuelled. Receipt has been submitted.",
      created_at: minutesAgo(96),
    },
    {
      id: "demo-msg-8",
      direction: "outbound",
      status: "sent",
      text: "Noted, thank you. The fuel claim will be processed with this week's batch.",
      created_at: minutesAgo(92),
    },
  ],
  "demo-grace": [
    {
      id: "demo-msg-7",
      direction: "inbound",
      status: "read",
      text: "Delivery completed successfully. The proof of delivery has been uploaded.",
      created_at: minutesAgo(185),
    },
  ],
};
