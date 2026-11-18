import type {
  FaqCategory,
  HelpArticle,
  ResourceCategory,
  ResourceHero,
} from "@/ui/components/resources/resource-types";
import {
  Cpu,
  CreditCard,
  Files,
  MapTrifold,
  Question,
  Truck,
  WifiHigh,
} from "@phosphor-icons/react";
import {
  FileText,
  Rocket,
  ShieldCheck,
} from "lucide-react";

/*
 * Copy for the three Resources pages (Figma frames "Landing Page (EDocumentation)",
 * "Landing Page (Help Articles)" and "Landing Page (FAQs)").
 * TODO(content): document `href`s are not published yet; help-article summaries and
 * FAQ answers are not in the Figma file and were written to match the product copy.
 */

// ── Documentation ────────────────────────────────────────────────────────────

export const DOCUMENTATION_HERO: ResourceHero = {
  title: "Documentation",
  description: "Comprehensive platform documentation for admins and operators.",
  icon: Files,
  descriptionClassName: "lg:text-[20px]",
};

export const DOC_CATEGORIES: ResourceCategory[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    docs: [
      {
        title: "Platform overview",
        description: "A high-level tour of FleetPro Enterprise: core modules, navigation, dashboards, and how operations, dispatch, finance and compliance teams work together inside one platform.",
      },
      {
        title: "Creating your organisation",
        description: "Step-by-step instructions for registering your company, configuring business and billing email, verifying your phone number, and selecting your subscription plan.",
      },
      {
        title: "Inviting team members",
        description: "How to invite users, assign departments, and manage pending invitations across your organization.",
      },
      {
        title: "Configuring roles & permissions",
        description: "Reference for the built-in role matrix, custom role creation, scope-based permissions, and best practices for least-privilege access.",
      },
    ],
  },
  {
    title: "Fleet Management",
    icon: Truck,
    docs: [
      {
        title: "Registering vehicles",
        description: "How to add vehicles individually or in bulk via CSV, attach VIN, plate, axle configuration, fuel type, ownership and insurance details.",
      },
      {
        title: "Driver profiles & licenses",
        description: "Capturing driver KYC, licence categories, expiry tracking, medicals, training certificates and assignment to vehicles or routes.",
      },
      {
        title: "Maintenance schedules",
        description: "Configure preventive maintenance intervals by mileage, engine hours or calendar time; manage workshop jobs and parts inventory.",
      },
      {
        title: "Document expiry tracking",
        description: "Track roadworthiness, hackney permits, insurance, and licence expirations with automated alerts to fleet managers and drivers.",
      },
    ],
  },
  {
    title: "Live Tracking & IoT",
    icon: Cpu,
    docs: [
      {
        title: "Installing IoT devices",
        description: "Approved hardware list, wiring diagrams, activation steps, and how to bind a tracker to a vehicle inside the Fleet Pro console.",
      },
      {
        title: "SIM provisioning",
        description: "Ordering, activating and managing M2M SIMs through the platform, including data pools and roaming controls.",
      },
      {
        title: "Geofencing & alerts",
        description: "Drawing circular or polygonal geofences, configuring entry/exit/dwell alerts, and routing notifications to teams or customers.",
      },
      {
        title: "Trip playback",
        description: "Reviewing historical trips, speed events, stops, fuel anomalies and harsh-driving incidents on the playback timeline.",
      },
    ],
  },
  {
    title: "Dispatch & Operations",
    icon: MapTrifold,
    docs: [
      {
        title: "Creating dispatch jobs",
        description: "Manual and bulk job creation, pickup/drop-off windows, special handling instructions, and SLA configuration.",
      },
      {
        title: "Auto-assignment rules",
        description: "Set up rules engine for matching jobs to the nearest qualified driver based on capacity, skill, hours-of-service and geofence.",
      },
      {
        title: "Proof of delivery",
        description: "Capturing signatures, photos and OTPs on the driver app and surfacing them to customers and finance for billing.",
      },
      {
        title: "Customer notifications",
        description: "Templating SMS, email and WhatsApp messages for dispatch lifecycle events, including branded tracking links.",
      },
    ],
  },
  {
    title: "Billing & Subscriptions",
    icon: CreditCard,
    docs: [
      {
        title: "Plan management",
        description: "Compare plans, upgrade or downgrade, and understand proration on mid-cycle changes.",
      },
      {
        title: "Invoices & receipts",
        description: "Download VAT-compliant invoices, configure billing contacts, and reconcile payments against your accounting system.",
      },
      {
        title: "Quota allocation",
        description: "Distribute vehicle, driver and API quotas across departments or subsidiaries within a single organisation.",
      },
      {
        title: "Payment methods",
        description: "Add and manage cards and a MoMo Pay wallet; set a default method and backup method for failed charges.",
      },
    ],
  },
  {
    title: "Security & Compliance",
    icon: ShieldCheck,
    docs: [
      {
        title: "SSO & 2FA setup",
        description: "Configure SAML/OIDC single sign-on with your identity provider and enforce TOTP or WebAuthn second factor for all users.",
      },
      {
        title: "Audit logs",
        description: "What is logged, retention windows, exporting to SIEM, and using audit logs for compliance and incident response.",
      },
      {
        title: "Data residency",
        description: "Choosing a regional data zone, what data stays in-region, and processor sub-list for GDPR/NDPR compliance.",
      },
      {
        title: "Role-based access",
        description: "Designing a role model that scales: scopes, resource filters, and recipes for common org structures.",
      },
    ],
  },
];

// ── Help Articles ────────────────────────────────────────────────────────────

export const HELP_ARTICLES_HERO: ResourceHero = {
  title: "Help Articles",
  description: "Searchable knowledge base and troubleshooting articles.",
  icon: FileText,
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    title: "How To Reset Your Password",
    topic: "Account Handling",
    readTime: "3 Min Read",
    updated: "May 2026",
    summary: "On the sign-in page choose “Forgot password”, enter your business email and follow the link we send you. Reset links expire after 30 minutes; if yours has expired, request a new one. Admins can also trigger a reset for any user from Settings → Users.",
  },
  {
    title: "Why Is My Vehicle Not Appearing On The Map?",
    topic: "Tracking",
    readTime: "2 Min Read",
    updated: "May 2026",
    summary: "Check that the vehicle has an active tracker bound to it, that the device’s SIM is online, and that the vehicle isn’t filtered out of the map view. Devices that haven’t reported for 24 hours are shown as offline in Live Tracking.",
  },
  {
    title: "Reassigning A Driver Mid-Trip",
    topic: "Operations",
    readTime: "1 Min Read",
    updated: "May 2026",
    summary: "Open the active job in Dispatch, choose “Reassign driver” and pick an available driver. The trip history is kept, the new driver is notified in the driver app, and the customer’s tracking link updates automatically.",
  },
  {
    title: "Exporting Trip Data To CSV",
    topic: "Reporting",
    readTime: "1 Min Read",
    updated: "May 2026",
    summary: "From Reports, choose the trip report, set the date range and vehicles, then select “Export → CSV”. Large exports are prepared in the background and emailed to you when they are ready.",
  },
  {
    title: "Configuring Whatsapp Notifications",
    topic: "Notifications",
    readTime: "2 Min Read",
    updated: "May 2026",
    summary: "Connect your WhatsApp Business number under Communications → WhatsApp Setup, approve your message templates, then choose which dispatch events (assigned, en route, delivered) send a message to customers.",
  },
  {
    title: "Understanding Your Invoice",
    topic: "Billing",
    readTime: "2 Min Read",
    updated: "May 2026",
    summary: "Each invoice lists your plan, the number of billable vehicles in the period, add-ons such as IoT bundles, any proration from mid-cycle plan changes, and VAT. Download past invoices from Billing → Invoices.",
  },
  {
    title: "Troubleshooting Offline IoT Devices",
    topic: "Devices",
    readTime: "2 Min Read",
    updated: "May 2026",
    summary: "Confirm the device has power and that the vehicle ignition wiring is intact, then check the SIM’s data balance and status in the platform. If the device still doesn’t report, restart it from the device page or contact support.",
  },
  {
    title: "Adding A New Payment Method",
    topic: "Billing",
    readTime: "1 Min Read",
    updated: "May 2026",
    summary: "Go to Billing → Payment methods and add a card or MoMo Pay wallet. You can set it as your default method or keep it as a backup that is charged when the default payment fails.",
  },
];

// ── FAQs ─────────────────────────────────────────────────────────────────────

export const FAQS_HERO: ResourceHero = {
  title: "FAQs",
  description: "Answers to the most common questions about FleetPro.",
  icon: Question,
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      {
        question: "How Do I Create A Fleet Pro Account?",
        answer: "Click “Get Started”, choose your organisation type and fill in your company details. Once your business email and phone number are verified and your documents are approved, your workspace is ready.",
      },
      {
        question: "How Long Does Onboarding Take?",
        answer: "Most organisations are set up within one to two business days, depending on how quickly verification documents are submitted and approved.",
      },
      {
        question: "Can I Try Fleet Pro Before Paying?",
        answer: "Yes. Contact our team to book a guided demo or request a trial workspace so you can explore the platform with your own vehicles before committing to a plan.",
      },
    ],
  },
  {
    title: "Billing & Subscriptions",
    icon: CreditCard,
    items: [
      {
        question: "What's The Difference Between Business And Billing Email?",
        answer: "Your business email is used for account access and operational notifications. Your billing email receives invoices, receipts and payment reminders, so it can point to your finance team.",
      },
      {
        question: "Can I Change My Plan Later?",
        answer: "Yes. You can upgrade or downgrade at any time from Billing. Changes made mid-cycle are prorated on your next invoice.",
      },
      {
        question: "What Payment Methods Are Accepted?",
        answer: "We accept debit and credit cards and MoMo Pay wallets. You can set a default method and a backup method for failed charges.",
      },
      {
        question: "How Are Vehicle Quotas Counted?",
        answer: "Quotas count the active vehicles registered in your organisation during the billing period. Archived vehicles don’t count towards your quota.",
      },
    ],
  },
  {
    title: "Devices & Connectivity",
    icon: WifiHigh,
    items: [
      {
        question: "Do I Have To Buy IoT Devices From Fleet Pro?",
        answer: "No. You can use any tracker on our approved hardware list, or order pre-configured devices and M2M SIMs directly through FleetPro.",
      },
      {
        question: "What Happens If A SIM Goes Offline?",
        answer: "The vehicle is marked offline in Live Tracking and an alert is raised. Most devices buffer location data and upload it once they reconnect, so trip history is preserved.",
      },
      {
        question: "Does Fleet Pro Work Without Internet?",
        answer: "The driver app keeps working offline and syncs jobs, proof of delivery and location data once a connection is available. The web console needs an internet connection.",
      },
    ],
  },
  {
    title: "Security & Compliance",
    icon: ShieldCheck,
    items: [
      {
        question: "Where Is My Data Stored?",
        answer: "Data is stored in the regional data zone you choose during setup, in line with GDPR and NDPR requirements.",
      },
      {
        question: "Does Fleet Pro Support SSO?",
        answer: "Yes. FleetPro supports SAML and OIDC single sign-on with your identity provider, and you can enforce two-factor authentication for all users.",
      },
      {
        question: "Is My Data Encrypted?",
        answer: "Yes. All data is encrypted in transit with TLS and at rest, and every access is recorded in the audit log.",
      },
    ],
  },
];
