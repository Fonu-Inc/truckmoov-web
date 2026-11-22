import type {
  SupportTicketCategory,
  SupportTicketChannel,
  SupportTicketContextDeviceSnapshot,
  SupportTicketPriority,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSimsQueryOptions,
  getSupportTicketContextQueryOptions,
  useCreateSupportTicket,
} from "@truckmoov/api/auth";
import {
  getDevicesQueryOptions,
  getVehiclesQueryOptions,
} from "@truckmoov/api/fleet";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Cpu,
  CreditCard,
  HelpCircle,
  Loader2,
  PackageCheck,
  Rocket,
  Truck,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { MIN_TICKET_TEXT } from "./ticketAttachments";

type ReportIssueProps = { onSuccess: () => void };

/** Only these have a record of the tenant's own to pick; the rest skip the context step. */
type RecordContext = "device" | "sim" | "vehicle";

type IssueCategory = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  context: RecordContext | null;
  ticketCategory: SupportTicketCategory;
  channel: SupportTicketChannel;
  issues: string[];
};

type ContextItem = {
  id: string; label: string; status?: string; extra?: string;
};

const CATEGORIES: IssueCategory[] = [
  {
    id: "onboarding_activation",
    label: "Application & Account Activation",
    description: "Application review, activation link, Get Started steps, subscription activation.",
    icon: Rocket,
    context: null,
    ticketCategory: "account_access",
    channel: "other",
    issues: [
      "My application is still under review",
      "I did not receive my activation link",
      "I cannot complete a Get Started step",
      "My account upgrade request has not been approved",
    ],
  },
  {
    id: "procurement",
    label: "Ordering Devices, SIMs & Vehicles",
    description: "Requests, quotations, payment and order progress before installation.",
    icon: PackageCheck,
    context: null,
    ticketCategory: "billing",
    channel: "billing",
    issues: [
      "My quotation has not been generated",
      "My payment was made but the order has not moved on",
      "A quotation has the wrong items or quantities",
      "I want to change or cancel a request",
    ],
  },
  {
    id: "installation",
    label: "Installation & Device Configuration",
    description: "Installer scheduling, fitting, device configuration and installation reports.",
    icon: Wrench,
    context: "device",
    ticketCategory: "device_tracking",
    channel: "device",
    issues: [
      "My installation has not been scheduled",
      "The installer did not arrive",
      "My device was installed but is not configured",
      "My installation report is missing or wrong",
    ],
  },
  {
    id: "device_tracking",
    label: "Devices & Tracking",
    description: "Offline devices, no location updates, firmware updates, device health.",
    icon: Cpu,
    context: "device",
    ticketCategory: "device_tracking",
    channel: "device",
    issues: [
      "My device is offline",
      "Vehicle location is not updating",
      "A firmware update failed",
      "Device readings look wrong",
    ],
  },
  {
    id: "sim_connectivity",
    label: "IoT SIMs & Connectivity",
    description: "SIM provisioning, activation, data bundles, usage and suspension.",
    icon: Wifi,
    context: "sim",
    ticketCategory: "sim_connectivity",
    channel: "sim",
    issues: [
      "My SIM request has not been approved",
      "My SIM is not activated or has no data",
      "My data bundle has run out or expired",
      "My SIM was suspended",
    ],
  },
  {
    id: "messaging",
    label: "WhatsApp, SMS, Calls & Campaigns",
    description: "Driver messaging, the 24-hour WhatsApp window, campaigns and IVR prompts.",
    icon: Bell,
    context: null,
    ticketCategory: "messaging",
    channel: "messaging",
    issues: [
      "My WhatsApp message would not send",
      "A driver is not receiving SMS",
      "A campaign did not go out",
      "A call or IVR prompt is not working",
    ],
  },
  {
    id: "billing",
    label: "Billing, Invoices & Payments",
    description: "Hardware devices, licensing, installation and subscription charges.",
    icon: CreditCard,
    context: null,
    ticketCategory: "billing",
    channel: "billing",
    issues: [
      "An invoice amount looks wrong",
      "My payment is not reflecting",
      "I need a copy of an invoice or receipt",
      "I want to change my plan or billing details",
    ],
  },
  {
    id: "jobs_dispatch",
    label: "Jobs & Dispatch",
    description: "Creating jobs, recommending or assigning drivers and vehicles, job status.",
    icon: Truck,
    context: "vehicle",
    ticketCategory: "other",
    channel: "vehicle",
    issues: [
      "I cannot recommend or assign a driver or vehicle",
      "A job is stuck on the wrong status",
      "A driver did not receive a job offer",
      "Proof of delivery is missing",
    ],
  },
  {
    id: "account_access",
    label: "Account, Users & Access",
    description: "Invitations, roles and permissions, sign-in problems, organisation profile.",
    icon: Users,
    context: null,
    ticketCategory: "account_access",
    channel: "other",
    issues: [
      "A team member did not receive their invitation",
      "Someone has the wrong role or permissions",
      "I cannot sign in",
      "I need to change my organisation details",
    ],
  },
  {
    id: "other",
    label: "Something Else",
    description: "Anything that does not fit the categories above.",
    icon: HelpCircle,
    context: null,
    ticketCategory: "other",
    channel: "other",
    issues: [],
  },
];

const CONTEXT_LABELS: Record<RecordContext, string> = {
  device: "Device", sim: "SIM", vehicle: "Vehicle",
};

const PRIORITIES: {
  value: SupportTicketPriority; label: string;
}[] = [
  {
    value: "low", label: "Low - General question or minor issue",
  },
  {
    value: "medium", label: "Medium - Affecting operations",
  },
  {
    value: "high", label: "High - Significant business impact",
  },
  {
    value: "critical", label: "Critical - Complete system down",
  },
];

const HEALTH_LABELS: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  never_reported: "Never reported",
};

/** The tenant's own devices, SIMs or vehicles to pick from; each list loads only when its step is open. */
function useContextItems(context: RecordContext | null) {
  const devices = useQuery({
    ...getDevicesQueryOptions(),
    enabled: context === "device",
  });
  const sims = useQuery({
    ...getSimsQueryOptions({ params: { limit: 100 } }),
    enabled: context === "sim",
  });
  const vehicles = useQuery({
    ...getVehiclesQueryOptions(),
    enabled: context === "vehicle",
  });

  if (context === "device") {
    return {
      isLoading: devices.isLoading,
      isError: devices.isError,
      refetch: devices.refetch,
      items: (devices.data?.data ?? []).map((d): ContextItem => ({
        id: d.id,
        label: [
          d.name || [
            d.manufacturer,
            d.model,
          ].filter(Boolean).join(" "),
          d.imei,
        ].filter(Boolean).join(" · "),
        status: d.status,
        extra: d.lastSeen ? `Last seen ${formatDayMonthTime(d.lastSeen)}` : "Never reported",
      })),
    };
  }
  if (context === "sim") {
    return {
      isLoading: sims.isLoading,
      isError: sims.isError,
      refetch: sims.refetch,
      items: (sims.data?.data.items ?? []).map((s): ContextItem => ({
        id: s.id,
        label: `${s.mobileNumber} (${s.iccid.slice(-6)})`,
        status: s.status,
        extra: [
          s.operator,
          s.dataUsedGb != null && s.dataLimitGb != null ? `${s.dataUsedGb}/${s.dataLimitGb} GB` : null,
        ].filter(Boolean).join(" · "),
      })),
    };
  }
  if (context === "vehicle") {
    return {
      isLoading: vehicles.isLoading,
      isError: vehicles.isError,
      refetch: vehicles.refetch,
      items: (vehicles.data?.data ?? []).map((v): ContextItem => ({
        id: v.id,
        label: [
          v.registrationNumber || v.plateNumber,
          [
            v.make,
            v.model,
          ].filter(Boolean).join(" "),
        ].filter(Boolean).join(" - "),
        status: v.status,
      })),
    };
  }
  return {
    items: [] as ContextItem[], isLoading: false, isError: false, refetch: async () => undefined,
  };
}

function StepBadge({
  n, done,
}: {
  n: number; done: boolean;
}) {
  return (
    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${done ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : n}
    </div>
  );
}

export function ReportIssue({ onSuccess }: ReportIssueProps) {
  const createTicket = useCreateSupportTicket();

  const [
    step,
    setStep,
  ] = useState(1);
  const [
    categoryId,
    setCategoryId,
  ] = useState<string | null>(null);
  const [
    contextId,
    setContextId,
  ] = useState<string | null>(null);
  const [
    contextFilter,
    setContextFilter,
  ] = useState("");
  const [
    subject,
    setSubject,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    priority,
    setPriority,
  ] = useState<SupportTicketPriority>("medium");

  const category = CATEGORIES.find(c => c.id === categoryId) ?? null;
  const context = category?.context ?? null;
  const contextItems = useContextItems(step === 2 ? context : null);
  const filteredItems = contextFilter.trim()
    ? contextItems.items.filter(i => `${i.label} ${i.extra ?? ""}`.toLowerCase().includes(contextFilter.trim().toLowerCase()))
    : contextItems.items;
  const [
    selectedLabel,
    setSelectedLabel,
  ] = useState("");

  // Device and vehicle tickets carry a server-read snapshot; preview the same one.
  const takesSnapshot = !!contextId && (context === "device" || context === "vehicle");
  const contextQuery = useQuery({
    ...getSupportTicketContextQueryOptions({
      contextType: context ?? "",
      contextId: contextId ?? "",
    }),
    enabled: takesSnapshot,
  });
  const snapshot = contextQuery.data?.data.available ? contextQuery.data.data.snapshot : null;

  const subjectOk = subject.trim().length >= MIN_TICKET_TEXT;
  const descriptionOk = description.trim().length >= MIN_TICKET_TEXT;
  const detailsStep = context ? 3 : 2;

  const pickCategory = (next: IssueCategory) => {
    setCategoryId(next.id);
    setSubject("");
    setContextId(null);
    setSelectedLabel("");
    setContextFilter("");
    setStep(next.context ? 2 : 3);
  };

  const handleSubmit = async () => {
    if (!category || !subjectOk || !descriptionOk)
      return;
    try {
      await createTicket.mutateAsync({
        data: {
          category: category.ticketCategory,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          channel: category.channel,
          // Context only with a picked record: the server refuses a type without an id.
          ...(context && contextId
            ? {
                contextType: context, contextId,
              }
            : {}),
        },
      });
      toast.success("Ticket logged");
      onSuccess();
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log ticket");
    }
  };

  return (
    <div className="space-y-6 w-full">
      <Card className={step !== 1 ? "opacity-60" : ""}>
        <CardHeader
          className="cursor-pointer"
          onClick={() => step > 1 && setStep(1)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StepBadge
                n={1}
                done={step > 1}
              />
              <CardTitle className="text-lg">Issue Category</CardTitle>
            </div>
            {category && step > 1 && <Badge variant="outline">{category.label}</Badge>}
          </div>
          {step === 1 && <CardDescription>What type of issue are you experiencing?</CardDescription>}
        </CardHeader>
        {step === 1 && (
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => pickCategory(cat)}
                  className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors hover:border-primary/50 ${
                    categoryId === cat.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <cat.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block font-medium">{cat.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{cat.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {step >= 2 && context && (
        <Card className={step !== 2 ? "opacity-60" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => step > 2 && setStep(2)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StepBadge
                  n={2}
                  done={step > 2}
                />
                <CardTitle className="text-lg">{`Select ${CONTEXT_LABELS[context]}`}</CardTitle>
              </div>
              {contextId && step > 2 && (
                <Badge
                  variant="outline"
                  className="max-w-[50%] truncate"
                >
                  {selectedLabel}
                </Badge>
              )}
            </div>
            {step === 2 && (
              <CardDescription>
                {`Select the affected ${CONTEXT_LABELS[context].toLowerCase()} so its details are attached to the ticket.`}
              </CardDescription>
            )}
          </CardHeader>
          {step === 2 && (
            <CardContent className="space-y-3">
              {contextItems.items.length > 8 && (
                <Input
                  value={contextFilter}
                  onChange={e => setContextFilter(e.target.value)}
                  placeholder={`Search your ${CONTEXT_LABELS[context].toLowerCase()}s`}
                />
              )}
              {contextItems.isLoading
                ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )
                : contextItems.isError
                  ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {`Couldn't load your ${CONTEXT_LABELS[context].toLowerCase()}s.`}
                        <Button
                          variant="link"
                          onClick={() => void contextItems.refetch()}
                        >
                          Try again
                        </Button>
                      </div>
                    )
                  : filteredItems.length === 0
                    ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          {`No ${CONTEXT_LABELS[context].toLowerCase()}s found.`}
                        </p>
                      )
                    : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {filteredItems.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setContextId(option.id);
                                setSelectedLabel(option.label);
                                setStep(3);
                              }}
                              className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors hover:border-primary/50 ${
                                contextId === option.id ? "border-primary bg-primary/5" : ""
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{option.label}</p>
                                {option.extra && <p className="text-xs text-muted-foreground">{option.extra}</p>}
                              </div>
                              {option.status && (
                                <Badge
                                  variant="outline"
                                  className="capitalize shrink-0"
                                >
                                  {option.status.replace(
                                    /_/g,
                                    " ",
                                  )}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContextId(null);
                    setSelectedLabel("");
                    setStep(3);
                  }}
                >
                  {`Skip - No specific ${CONTEXT_LABELS[context].toLowerCase()}`}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {step >= 3 && category && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge
                n={detailsStep}
                done={false}
              />
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </div>
            <CardDescription>Describe your issue in detail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {takesSnapshot && contextQuery.isLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reading its current state…
              </p>
            )}
            {snapshot && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  Context auto-attached
                </p>
                {context === "device"
                  ? (() => {
                      const snap = snapshot as SupportTicketContextDeviceSnapshot;
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            {"IMEI: "}
                            <span className="text-foreground">{snap.imei ?? "-"}</span>
                          </div>
                          <div>
                            {"Status: "}
                            <span className="text-foreground">{snap.status ?? "-"}</span>
                          </div>
                          <div>
                            {"Health: "}
                            <span className="text-foreground">{HEALTH_LABELS[snap.healthStatus] ?? snap.healthStatus}</span>
                          </div>
                          <div>
                            {"Last seen: "}
                            <span className="text-foreground">{snap.lastSeen ? formatDayMonthTime(snap.lastSeen) : "Never reported"}</span>
                          </div>
                        </div>
                      );
                    })()
                  : (
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {Object.entries(snapshot as Record<string, unknown>).slice(
                          0,
                          6,
                        ).map(([
                          key,
                          value,
                        ]) => (
                          <div key={key}>
                            {`${key}: `}
                            <span className="text-foreground">{value == null ? "-" : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            )}

            {category.issues.length > 0 && (
              <div className="space-y-2">
                <Label>{`Common issues in ${category.label}`}</Label>
                <div className="flex flex-wrap gap-2">
                  {category.issues.map(issue => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setSubject(issue)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-primary/50 ${
                        subject === issue ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
              />
              {subject.length > 0 && !subjectOk && (
                <p className="text-xs text-destructive">{`At least ${MIN_TICKET_TEXT} characters.`}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. What happened? What did you expect? When did it start?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
              />
              {description.length > 0 && !descriptionOk && (
                <p className="text-xs text-destructive">{`At least ${MIN_TICKET_TEXT} characters.`}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={v => setPriority(v as SupportTicketPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem
                      key={p.value}
                      value={p.value}
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(context ? 2 : 1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!subjectOk || !descriptionOk || createTicket.isPending}
                >
                  {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
