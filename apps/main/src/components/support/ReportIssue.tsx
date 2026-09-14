import type {
  SupportTicketCategory,
  SupportTicketChannel,
  SupportTicketContextDeviceSnapshot,
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

// Category → context type. Only device/vehicle return a real snapshot today
// (per spec §C); anything else skips the context step entirely.
const CATEGORY_CONTEXT: Record<string, "device" | "vehicle" | null> = {
  device_tracking: "device",
  sim_connectivity: "device",
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

  const contextType = CATEGORY_CONTEXT[category] ?? null;
  const contextIdIsValid = debouncedContextId.length > 0 && CONTEXT_ID_PATTERN.test(debouncedContextId);

  const contextQuery = useQuery({
    ...getSupportTicketContextQueryOptions({
      contextType: contextType ?? "device",
      contextId: debouncedContextId,
    }),
    enabled: !!contextType && contextIdIsValid,
  });
  const contextPayload = contextQuery.data?.data;

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
          // Send channel from the category's context type when known so the
          // ticket lists channel = "device" / "vehicle"; else omit.
          channel: contextType ? (contextType as SupportTicketChannel) : undefined,
          // ⚠️ Never send contextSnapshot. Server reads and stores it — spec §D.
          ...(contextType && contextIdIsValid
            ? {
                contextType, contextId: debouncedContextId,
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
                            const nextContext = CATEGORY_CONTEXT[cat.value] ?? null;
                            setStep(nextContext ? 2 : 3);
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

      {/* Step 2: Context (only device/vehicle) */}
      {step >= 2 && contextType && (
        <Card className={step !== 2 ? "opacity-60" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => step > 2 && setStep(2)}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 2 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </div>
              <CardTitle className="text-lg">
                {contextType === "device" ? "Device details" : "Vehicle details"}
              </CardTitle>
            </div>
            {step === 2 && (
              <CardDescription>
                Enter the
                {" "}
                {contextType === "device" ? "IMEI or device id" : "registration number"}
                . We'll attach a snapshot to the ticket — leave blank if unknown.
              </CardDescription>
            )}
          </CardHeader>
          {step === 2 && (
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="context-id">
                  {contextType === "device" ? "Device IMEI or id" : "Vehicle registration"}
                </Label>
                <Input
                  id="context-id"
                  value={contextId}
                  onChange={e => setContextId(e.target.value)}
                  placeholder={contextType === "device" ? "e.g. 862176050123456" : "e.g. LSR-482-XK"}
                  maxLength={64}
                  autoComplete="off"
                />
                {debouncedContextId && !contextIdIsValid && (
                  <p className="text-xs text-destructive">
                    Only letters, numbers, hyphens and underscores are allowed (max 64 characters).
                  </p>
                )}
              </div>

              {contextType && contextIdIsValid && contextQuery.isLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Looking up…
                </p>
              )}

              {contextType === "device" && contextPayload?.available && contextPayload.snapshot && (() => {
                const snap = contextPayload.snapshot as SupportTicketContextDeviceSnapshot;
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
                      {snap.imei ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status: </span>
                      {snap.status ?? "—"}
                      {" · "}
                      <span className="text-muted-foreground">Health: </span>
                      {snap.healthStatus}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last seen: </span>
                      {snap.lastSeen ? formatDayMonthTime(snap.lastSeen) : "Never reported"}
                    </p>
                  </div>
                );
              })()}

              {contextType === "vehicle" && contextPayload?.available && contextPayload.snapshot && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle snapshot attached
                  </p>
                </div>
              )}

              {debouncedContextId && contextIdIsValid && !contextQuery.isLoading && contextPayload && !contextPayload.available && (
                <p className="text-xs text-muted-foreground">
                  We couldn't read that record right now. You can still submit the ticket — the fault will be reviewed manually.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContextId("");
                    setDebouncedContextId("");
                    setStep(3);
                  }}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
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
                {contextType ? "3" : "2"}
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

            {contextType && contextIdIsValid && contextPayload && !contextPayload.available && (
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
