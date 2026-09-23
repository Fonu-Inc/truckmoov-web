import type {
  SupportTicketCategory,
  SupportTicketChannel,
  SupportTicketContextDeviceSnapshot,
  SupportTicketContextType,
  SupportTicketPriority,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketContextQueryOptions,
  getSupportTicketOptionsQueryOptions,
  useCreateSupportTicket,
} from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Cpu,
  CreditCard,
  HelpCircle,
  Loader2,
  Truck,
  Users,
  Wifi,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
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

type ReportIssueProps = { onSuccess: () => void };

// Icons per category value — options endpoint only carries value/label.
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  device_tracking: Cpu,
  sim_connectivity: Wifi,
  messaging: Bell,
  billing: CreditCard,
  billing_subscription: CreditCard,
  account_access: Users,
  compliance: HelpCircle,
  onboarding: HelpCircle,
  other: HelpCircle,
};

// Pre-selects the "what is this about" picker; the reporter can change it. The picker's
// choices come from options.contextTypes. Only device/vehicle return a snapshot (§C).
const DEFAULT_CONTEXT: Record<string, string> = {
  device_tracking: "device",
  sim_connectivity: "sim",
  messaging: "whatsapp",
  billing: "billing",
  billing_subscription: "billing",
};
const SNAPSHOT_CONTEXTS = new Set([
  "device",
  "vehicle",
]);

// Context type → ticket channel (values from options.channels).
const CONTEXT_CHANNEL: Record<string, SupportTicketChannel> = {
  device: "device",
  vehicle: "vehicle",
  sim: "sim",
  whatsapp: "messaging",
  billing: "billing",
  none: "other",
};

const HEALTH_LABELS: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  never_reported: "Never reported",
};

// ponytail: spec's security guard. Anything else returns available:false and
// makes no upstream call — skip the client round-trip.
const CONTEXT_ID_PATTERN = /^[\w-]{1,64}$/;

export function ReportIssue({ onSuccess }: ReportIssueProps) {
  const createTicket = useCreateSupportTicket();
  const optionsQuery = useQuery(getSupportTicketOptionsQueryOptions());
  const options = optionsQuery.data?.data;

  const [
    step,
    setStep,
  ] = useState(1);

  const [
    category,
    setCategory,
  ] = useState<string>("");
  const [
    contextType,
    setContextType,
  ] = useState<string>("none");
  const [
    contextId,
    setContextId,
  ] = useState<string>("");
  const [
    debouncedContextId,
    setDebouncedContextId,
  ] = useState<string>("");
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
  ] = useState<string>("medium");

  useEffect(
    () => {
      const t = setTimeout(
        setDebouncedContextId,
        400,
        contextId,
      );
      return () => clearTimeout(t);
    },
    [contextId],
  );

  const hasContext = contextType !== "none";
  const takesSnapshot = SNAPSHOT_CONTEXTS.has(contextType);
  // Submit uses what's typed now; only the lookup is debounced.
  const typedIdIsValid = contextId.length > 0 && CONTEXT_ID_PATTERN.test(contextId);
  const contextIdIsValid = debouncedContextId.length > 0 && CONTEXT_ID_PATTERN.test(debouncedContextId);

  const contextQuery = useQuery({
    ...getSupportTicketContextQueryOptions({
      contextType: contextType as "device" | "vehicle",
      contextId: debouncedContextId,
    }),
    enabled: takesSnapshot && contextIdIsValid,
  });
  const contextPayload = contextQuery.data?.data;
  // available:true without a snapshot is still "couldn't read it", never "healthy".
  const snapshot = contextPayload?.available ? contextPayload.snapshot : null;
  const lookupFailed = takesSnapshot && contextIdIsValid && !contextQuery.isLoading && !!contextPayload && !snapshot;
  const contextTypeLabel = options?.contextTypes.find(c => c.value === contextType)?.label ?? contextType;

  const selectedCategoryLabel = useMemo(
    () => options?.categories.find(c => c.value === category)?.label ?? category,
    [
      options,
      category,
    ],
  );

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim())
      return;
    try {
      await createTicket.mutateAsync({
        data: {
          category: category as SupportTicketCategory,
          subject: subject.trim(),
          description: description.trim(),
          priority: priority as SupportTicketPriority,
          channel: CONTEXT_CHANNEL[contextType] ?? "other",
          // ⚠️ Never send contextSnapshot — the server reads and stores it, and 400s a client copy (§D).
          ...(hasContext
            ? {
                contextType: contextType as SupportTicketContextType,
                ...(typedIdIsValid ? { contextId } : {}),
              }
            : {}),
        },
      });
      toast.success("Ticket logged");
      onSuccess();
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log ticket";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Step 1: Category */}
      <Card className={step !== 1 ? "opacity-60" : ""}>
        <CardHeader
          className="cursor-pointer"
          onClick={() => step > 1 && setStep(1)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 1 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              <CardTitle className="text-lg">Issue Category</CardTitle>
            </div>
            {category && step > 1 && (
              <Badge variant="outline">{selectedCategoryLabel}</Badge>
            )}
          </div>
          {step === 1 && (
            <CardDescription>What type of issue are you experiencing?</CardDescription>
          )}
        </CardHeader>
        {step === 1 && (
          <CardContent>
            {optionsQuery.isLoading || !options
              ? <p className="text-sm text-muted-foreground">Loading categories…</p>
              : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {options.categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.value] ?? HelpCircle;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            setCategory(cat.value);
                            setContextId("");
                            setDebouncedContextId("");
                            setContextType(DEFAULT_CONTEXT[cat.value] ?? "none");
                            setStep(2);
                          }}
                          className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors hover:border-primary/50 ${
                            category === cat.value ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
          </CardContent>
        )}
      </Card>

      {/* Step 2: What the issue is about — types from options.contextTypes */}
      {step >= 2 && (
        <Card className={step !== 2 ? "opacity-60" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => step > 2 && setStep(2)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 2 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                  {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                </div>
                <CardTitle className="text-lg">What is this about?</CardTitle>
              </div>
              {step > 2 && hasContext && <Badge variant="outline">{contextTypeLabel}</Badge>}
            </div>
            {step === 2 && (
              <CardDescription>
                Pick what the issue relates to. For a device or vehicle we attach its current state to the ticket.
              </CardDescription>
            )}
          </CardHeader>
          {step === 2 && (
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Related to</Label>
                <Select
                  value={contextType}
                  onValueChange={(value) => {
                    setContextType(value);
                    setContextId("");
                    setDebouncedContextId("");
                  }}
                  disabled={!options}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsQuery.isLoading ? "Loading…" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.contextTypes.map(c => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasContext && (
                <div className="space-y-1.5">
                  <Label htmlFor="context-id">
                    {contextType === "device" ? "Device IMEI or id" : contextType === "vehicle" ? "Vehicle id or registration" : `${contextTypeLabel} reference`}
                    {" (optional)"}
                  </Label>
                  <Input
                    id="context-id"
                    value={contextId}
                    onChange={e => setContextId(e.target.value)}
                    placeholder={contextType === "device" ? "e.g. 862176050123456" : contextType === "vehicle" ? "e.g. LSR-482-XK" : ""}
                    maxLength={64}
                    autoComplete="off"
                  />
                  {contextId && !typedIdIsValid && (
                    <p className="text-xs text-destructive">
                      Only letters, numbers, hyphens and underscores are allowed (max 64 characters).
                    </p>
                  )}
                </div>
              )}

              {takesSnapshot && contextIdIsValid && contextQuery.isLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Looking up…
                </p>
              )}

              {contextType === "device" && snapshot && (() => {
                const snap = snapshot as SupportTicketContextDeviceSnapshot;
                return (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                    <p className="font-medium text-sm">
                      {[
                        snap.manufacturer,
                        snap.model,
                      ].filter(Boolean).join(" ") || "Device"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">IMEI: </span>
                      {snap.imei ?? "-"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status: </span>
                      {snap.status ?? "-"}
                      {" · "}
                      <span className="text-muted-foreground">Lifecycle: </span>
                      {snap.lifecycleStatus ?? "-"}
                      {" · "}
                      <span className="text-muted-foreground">Health: </span>
                      {HEALTH_LABELS[snap.healthStatus] ?? snap.healthStatus}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last seen: </span>
                      {snap.lastSeen ? formatDayMonthTime(snap.lastSeen) : "Never reported"}
                    </p>
                  </div>
                );
              })()}

              {contextType === "vehicle" && snapshot && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle
                  </p>
                  {/* ponytail: vehicle snapshot fields aren't specified; render what the server sends. */}
                  {Object.entries(snapshot as Record<string, unknown>).map(([
                    key,
                    value,
                  ]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{`${key}: `}</span>
                      {value == null ? "-" : String(value)}
                    </p>
                  ))}
                </div>
              )}

              {lookupFailed && (
                <p className="text-xs text-muted-foreground">
                  We couldn't read that record right now. You can still submit the ticket — it will be reviewed manually.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={!!contextId && !typedIdIsValid}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 3: Ticket details */}
      {step >= 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </div>
            <CardDescription>Describe your issue in detail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
              />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={!options}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsQuery.isLoading ? "Loading…" : "Priority"} />
                </SelectTrigger>
                <SelectContent>
                  {options?.priorities.map(p => (
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

            {lookupFailed && (
              <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p>
                  We couldn't read the
                  {" "}
                  {contextType}
                  {" "}
                  right now, so no snapshot will be attached. The ticket will still be created.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Start Over
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!subject.trim() || !description.trim() || createTicket.isPending}
              >
                {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
