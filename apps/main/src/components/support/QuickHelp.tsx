import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Users,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/shadcn/accordion";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

type HelpCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  articles: HelpArticle[];
};

type HelpArticle = {
  id: string;
  title: string;
  steps: string[];
  warning?: string;
};

const helpCategories: HelpCategory[] = [
  {
    id: "device",
    label: "Device Installation & Configuration",
    icon: Cpu,
    description: "Setup, installation, and configuration guides for tracking devices",
    articles: [
      {
        id: "device-offline",
        title: "Device not showing online?",
        steps: [
          "Verify the SIM card is properly inserted and active",
          "Check that the device has power (LED indicators should be on)",
          "Confirm the APN settings match your carrier requirements",
          "Verify the server port and IP are correctly configured",
          "Check if the device protocol matches your platform settings",
          "Wait 2-5 minutes for the first heartbeat after power-on",
        ],
        warning: "If the device was recently installed, it may take up to 10 minutes for the first signal.",
      },
      {
        id: "device-config",
        title: "How to configure a new device",
        steps: [
          "Register the device IMEI in the platform",
          "Insert an activated IoT SIM card",
          "Power on the device and wait for network connection",
          "Send configuration SMS or use the device's config tool",
          "Set the correct server IP, port, and protocol",
          "Verify the device appears in the 'Devices' section",
        ],
      },
      {
        id: "device-telemetry",
        title: "Missing telemetry data",
        steps: [
          "Check if the device is showing as 'Online' in the dashboard",
          "Verify GPS antenna has clear sky view",
          "Ensure the vehicle ignition is ON (some devices require this)",
          "Check the device's reporting interval settings",
          "Review if there are any geofence or alert filters active",
        ],
      },
    ],
  },
  {
    id: "sim",
    label: "SIM & Connectivity",
    icon: Wifi,
    description: "IoT SIM activation, data usage, and network troubleshooting",
    articles: [
      {
        id: "sim-activation",
        title: "SIM not activating?",
        steps: [
          "Verify the SIM request has been approved by platform admin",
          "Check that the activation batch is completed",
          "Ensure the SIM is properly inserted in the device",
          "Verify network coverage in your area",
          "Wait up to 24 hours for carrier provisioning",
        ],
        warning: "SIM activation is managed by Fonu. If issues persist after 24 hours, the platform admin will escalate.",
      },
      {
        id: "sim-data",
        title: "Data usage too high",
        steps: [
          "Check the device's reporting frequency settings",
          "Review if there are unnecessary features enabled (e.g., photo uploads)",
          "Verify no firmware updates are being pushed",
          "Check for devices stuck in constant reconnection loops",
          "Consider switching to a higher data plan if usage is legitimate",
        ],
      },
      {
        id: "sim-suspended",
        title: "SIM suspended unexpectedly",
        steps: [
          "Check if the data limit was exceeded",
          "Verify the subscription is active and paid",
          "Review if there were any fraud alerts",
          "Contact support if suspension seems incorrect",
        ],
        warning: "SIM suspensions for fraud or abuse require platform admin review.",
      },
    ],
  },
  {
    id: "messaging",
    label: "WhatsApp / SMS / Calls",
    icon: MessageSquare,
    description: "Driver communication and message delivery issues",
    articles: [
      {
        id: "whatsapp-delivery",
        title: "WhatsApp messages not delivering",
        steps: [
          "Verify the driver's phone number is correct (include country code)",
          "Check if the driver has WhatsApp installed and active",
          "Ensure the WhatsApp Business account is properly connected",
          "Review message templates for approval status",
          "Check wallet balance for communication credits",
        ],
      },
      {
        id: "sms-issues",
        title: "SMS not being received",
        steps: [
          "Confirm the phone number format is correct",
          "Check if the carrier supports the message type",
          "Verify wallet has sufficient balance",
          "Review if the number is on any blocklist",
          "Try resending after a few minutes",
        ],
      },
      {
        id: "broadcast-failed",
        title: "Broadcast message partially failed",
        steps: [
          "Check the broadcast tracker for individual recipient status",
          "Review which drivers failed and their error messages",
          "Verify all phone numbers are in correct format",
          "Retry failed messages from the broadcast details page",
        ],
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Subscription",
    icon: CreditCard,
    description: "Wallet, payments, and subscription management",
    articles: [
      {
        id: "wallet-topup",
        title: "How to top up wallet",
        steps: [
          "Go to Wallet section in the dashboard",
          "Click 'Top Up' and enter the amount",
          "Choose your payment method (MTN MoMo recommended)",
          "Complete the payment on your phone",
          "Balance updates automatically within 2 minutes",
        ],
      },
      {
        id: "payment-failed",
        title: "Payment failed",
        steps: [
          "Check your mobile money or bank account balance",
          "Verify the phone number entered is correct",
          "Ensure you approved the payment prompt on your device",
          "Wait 5 minutes and try again",
          "If issue persists, contact support with the transaction reference",
        ],
      },
    ],
  },
  {
    id: "access",
    label: "Roles & Access",
    icon: Users,
    description: "User permissions, team management, and access control",
    articles: [
      {
        id: "user-roles",
        title: "Understanding user roles",
        steps: [
          "Tenant Admin: Full access to all fleet features",
          "Operations Manager: Fleet and device management",
          "Supervisor: Live tracking and driver management",
          "Dispatcher: Read-only access to tracking and dispatch",
          "Viewer/Finance: Read-only access to financial data",
        ],
      },
      {
        id: "invite-user",
        title: "How to invite team members",
        steps: [
          "Go to Settings > Team Management",
          "Click 'Invite User'",
          "Enter their email and select a role",
          "They will receive an invitation email",
          "Once accepted, they can log in with their credentials",
        ],
      },
    ],
  },
];

export function QuickHelp() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(null);

  const currentCategory = helpCategories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      {!selectedCategory && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map(category => (
            <Card
              key={category.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.label}</CardTitle>
                    <Badge
                      variant="secondary"
                      className="mt-1"
                    >
                      {category.articles.length}
                      {" "}
                      articles
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Articles */}
      {currentCategory && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to categories
            </button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <currentCategory.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{currentCategory.label}</CardTitle>
                  <CardDescription>{currentCategory.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                collapsible
                className="w-full"
              >
                {currentCategory.articles.map(article => (
                  <AccordionItem
                    key={article.id}
                    value={article.id}
                  >
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        {article.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {article.warning && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-chart-5/10 border border-chart-5/20">
                            <AlertTriangle className="h-4 w-4 text-chart-5 mt-0.5" />
                            <p className="text-sm text-chart-5">{article.warning}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          {article.steps.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3"
                            >
                              <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
