import type {
  DispatchJob, DispatchStop,
} from "@truckmoov/api/dispatch";
import {
  useDownloadJobAttachment, useJob,
} from "@truckmoov/api/dispatch";
import {
  useDriver, useVehicle,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  ArrowDown, Calendar, Clock, Download, FileText, Loader2, MapPin, MessageSquare, Package, Phone, Route as RouteIcon, Truck, User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatFileSize, saveBase64File,
} from "@/features/jobs/utils/jobFiles";
import {
  jobStatusLabel, jobStatusTone, PRIORITY_BADGE, STATUS_BADGE,
} from "@/features/jobs/utils/jobStatus";
import { cn } from "@/lib/utils";
import { CancelJobDialog } from "./CancelJobDialog";
import { JobProgressPanel } from "./JobProgressPanel";
import { JobTimeline } from "./JobTimeline";

type JobDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: DispatchJob | null;
  onReassignDriver?: () => void;
  onReassignVehicle?: () => void;
  /** When true, the actions read "Recommend" instead of "Assign". */
  recommendOnly?: boolean;
};

/** Official WhatsApp logo SVG */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-3">
      <header className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function Field({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium break-words">{value ?? "—"}</div>
    </div>
  );
}

function fmt(iso: string | undefined, pattern: string) {
  return iso ? format(
    new Date(iso),
    pattern,
  ) : undefined;
}

function schedule(start?: string, end?: string) {
  const anchor = start ?? end;
  if (!anchor)
    return "—";
  const range = [
    fmt(
      start,
      "HH:mm",
    ),
    fmt(
      end,
      "HH:mm",
    ),
  ].filter(Boolean).join(" – ");
  return `${fmt(
    anchor,
    "yyyy-MM-dd",
  )} · ${range}`;
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(
    0,
    2,
  ).toUpperCase();
}

// A driver's reply or the result of the message to them should show without a reload.
const DETAILS_REFRESH_MS = 15_000;

function Chips({ values }: { values?: string[] }) {
  if (!values?.length)
    return <>—</>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map(value => (
        <Badge
          key={value}
          variant="outline"
          className="text-[10px]"
        >
          {value}
        </Badge>
      ))}
    </div>
  );
}

function dimensionsText(dimensions: DispatchJob["dimensions"]) {
  if (!dimensions)
    return undefined;
  const {
    length_cm: length, width_cm: width, height_cm: height,
  } = dimensions;
  return length || width || height ? `${length ?? "—"} × ${width ?? "—"} × ${height ?? "—"} cm` : undefined;
}

const ROUTE_PIN = [
  "text-success",
  "text-destructive",
  "text-purple-500",
  "text-destructive",
];

export function JobDetailsDialog({
  open,
  onOpenChange,
  job: listedJob,
  onReassignDriver,
  onReassignVehicle,
  recommendOnly = false,
}: JobDetailsDialogProps) {
  const { format: formatCurrency } = useCurrency();
  const jobQuery = useJob(
    open ? listedJob?.id ?? "" : "",
    { refetchInterval: open ? DETAILS_REFRESH_MS : undefined },
  );
  const job = jobQuery.data?.data ?? listedJob;
  const downloadAttachment = useDownloadJobAttachment();
  const [
    cancelTarget,
    setCancelTarget,
  ] = useState<DispatchJob | null>(null);
  const driverQuery = useDriver(open ? job?.assigned_driver_id ?? "" : "");
  const vehicleQuery = useVehicle(open ? job?.assigned_vehicle_id ?? "" : "");

  if (!job)
    return null;

  const driver = driverQuery.data?.data;
  const vehicle = vehicleQuery.data?.data;
  const stops = job.stops ?? [];
  const status = job.status ?? "created";
  const isCancelled = status === "cancelled";
  const isCompleted = jobStatusTone(status) === "completed";
  const canReassign = !isCompleted && !isCancelled;
  const tw = job.time_window ?? {};

  const call = (fn: "wa" | "sms" | "tel", phone?: string) => {
    if (!phone)
      return toast.error("Phone number unavailable");
    if (fn === "wa") {
      globalThis.open(
        `https://wa.me/${phone.replace(
          /\D/g,
          "",
        )}`,
        "_blank",
      );
    }
    if (fn === "sms")
      globalThis.location.href = `sms:${phone}`;
    if (fn === "tel")
      globalThis.location.href = `tel:${phone}`;
  };

  const routePoints = [
    {
      label: "PICKUP ADDRESS", address: job.pickup?.address || "—",
    },
    ...stops.map(s => ({
      label: "INTERMEDIATE STOP", address: s.address,
    })),
    {
      label: "DELIVERY ADDRESS", address: job.dropoff?.address || "—",
    },
  ];

  const contacts: {
    label: string; stop?: DispatchStop; start?: string; end?: string;
  }[] = [
    {
      label: "Pickup Contact", stop: job.pickup, start: tw.pickup_start, end: tw.pickup_end,
    },
    ...stops.map(stop => ({
      label: "Intermediate Contact", stop,
    })),
    {
      label: "Delivery Contact", stop: job.dropoff, start: tw.dropoff_start, end: tw.dropoff_end,
    },
  ];
  const visibleContacts = contacts.filter(c => c.stop?.contact_name || c.stop?.contact_phone || c.stop?.company_name);
  const attachments = job.pod_attachments ?? [];
  const files = job.attachments ?? [];

  const downloadFile = (attachmentId: string) => downloadAttachment.mutate(
    {
      jobId: job.id ?? "", attachmentId,
    },
    {
      onSuccess: ({ data }) => saveBase64File(
        data.name ?? "attachment",
        data.content_type,
        data.content_base64 ?? "",
      ),
      onError: error => toast.error(error.message),
    },
  );

  const assignButton = (label: string, onClick?: () => void) => onClick && canReassign && (
    <Button
      variant="outline"
      size="sm"
      className="w-full mt-1"
      onClick={onClick}
    >
      {label}
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Job Details —
            {" "}
            {job.reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── 1 · Job Overview ── */}
          <section className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Job Overview</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Summary of the job request, route, and current status.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Job ID</p>
                <p className="font-mono text-sm font-semibold text-foreground">{job.reference || job.id}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase",
                  STATUS_BADGE[jobStatusTone(status)],
                )}
              >
                {jobStatusLabel(status)}
              </Badge>
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <RouteIcon className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Route
                </p>
              </div>
              <ol className="space-y-1">
                {routePoints.map((p, i) => (
                  <li key={`${p.label}-${p.address}`}>
                    <div className="flex items-start gap-2">
                      <MapPin
                        className={cn(
                          "h-3.5 w-3.5 mt-0.5 shrink-0",
                          i === routePoints.length - 1 ? "text-destructive" : ROUTE_PIN[i] ?? "text-purple-500",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {p.label}
                        </p>
                        <p className="text-sm font-medium break-words">{p.address}</p>
                      </div>
                    </div>
                    {i < routePoints.length - 1 && (
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground ml-[3px] my-0.5" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── 2 · Assignment ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Driver</h3>
              </div>
              {driver
                ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {initials(driver.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{driver.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground truncate">
                            {driver.id.slice(
                              0,
                              8,
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{driver.phone}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {driver.status}
                      </Badge>
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="WhatsApp"
                          onClick={() => call(
                            "wa",
                            driver.contactChannels?.whatsappNumber ?? driver.phone,
                          )}
                        >
                          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="SMS"
                          onClick={() => call(
                            "sms",
                            driver.contactChannels?.smsNumber ?? driver.phone,
                          )}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Call"
                          onClick={() => call(
                            "tel",
                            driver.contactChannels?.voiceNumber ?? driver.phone,
                          )}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                      {assignButton(
                        recommendOnly ? "Recommend Another Driver" : "Reassign Driver",
                        onReassignDriver,
                      )}
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {driverQuery.isLoading ? "Loading…" : "Not assigned"}
                      </p>
                      {assignButton(
                        recommendOnly ? "Recommend Driver" : "Assign Driver",
                        onReassignDriver,
                      )}
                    </div>
                  )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Vehicle</h3>
              </div>
              {vehicle
                ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">{vehicle.plateNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {[
                          vehicle.type,
                          [
                            vehicle.make,
                            vehicle.model,
                          ].filter(Boolean).join(" "),
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {vehicle.id.slice(
                          0,
                          8,
                        )}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {vehicle.status}
                      </Badge>
                      {assignButton(
                        recommendOnly ? "Recommend Another Vehicle" : "Reassign Vehicle",
                        onReassignVehicle,
                      )}
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {vehicleQuery.isLoading ? "Loading…" : "Not assigned"}
                      </p>
                      {assignButton(
                        recommendOnly ? "Recommend Vehicle" : "Assign Vehicle",
                        onReassignVehicle,
                      )}
                    </div>
                  )}
            </div>
          </div>

          <JobProgressPanel
            job={job}
            onCancel={() => setCancelTarget(job)}
          />

          {/* ── 3 · Job Details ── */}
          <SectionCard
            title="Job Details"
            icon={Package}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field
                label="Cargo Type"
                value={job.cargo_type || "—"}
              />
              <Field
                label="Cargo Category"
                value={job.cargo_category || "—"}
              />
              <Field
                label="Packages"
                value={job.packages_count ? `${job.packages_count}${job.cargo_unit && ![
                  "kg",
                  "tons",
                  "lbs",
                ].includes(job.cargo_unit) ? ` (${job.cargo_unit})` : ""}` : "—"}
              />
              <Field
                label="Declared Value"
                value={job.cargo_value_ngn ? formatCurrency(job.cargo_value_ngn) : "—"}
              />
              <Field
                label="Dimensions"
                value={dimensionsText(job.dimensions) ?? "—"}
              />
              <Field
                label="Cargo Weight"
                value={job.load_weight_kg ? `${Number((job.load_weight_kg / 1000).toFixed(2))}t` : "—"}
              />
              <Field
                label="Job Amount"
                value={formatCurrency(job.amount_ngn || 0)}
              />
              <Field
                label="Deadline"
                value={fmt(
                  job.deadline,
                  "MMM dd, HH:mm",
                ) ?? "—"}
              />
              <Field
                label="Priority"
                value={job.priority
                  ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase",
                          PRIORITY_BADGE[job.priority] ?? PRIORITY_BADGE.normal,
                        )}
                      >
                        {job.priority.toUpperCase()}
                      </Badge>
                    )
                  : "—"}
              />
              <Field
                label="Vehicle Type"
                value={<span className="capitalize">{job.required_vehicle_type || "—"}</span>}
              />
              <Field
                label="Pickup Schedule"
                value={schedule(
                  tw.pickup_start,
                  tw.pickup_end,
                )}
              />
              <Field
                label="Delivery Schedule"
                value={schedule(
                  tw.dropoff_start,
                  tw.dropoff_end,
                )}
              />
              <Field
                label="Intermediate Stops"
                value={stops.length ? String(stops.length) : "None"}
              />
              {job.load_volume_m3
                ? (
                    <Field
                      label="Volume"
                      value={`${job.load_volume_m3} m³`}
                    />
                  )
                : null}
              <div className="col-span-2 sm:col-span-2">
                <Field
                  label="Special Handling"
                  value={<Chips values={job.special_handling} />}
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Field
                  label="Equipment Needed"
                  value={<Chips values={job.equipment} />}
                />
              </div>
              {job.delivered_at && (
                <Field
                  label="Delivered"
                  value={fmt(
                    job.delivered_at,
                    "MMM dd, HH:mm",
                  )}
                />
              )}
              <div className="col-span-2 sm:col-span-4">
                <Field
                  label="Description"
                  value={job.cargo_description || "No description"}
                />
              </div>
            </div>

            {files.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Files
                </p>
                <ul className="space-y-1.5">
                  {files.map(file => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size_bytes)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        disabled={downloadAttachment.isPending}
                        onClick={() => file.id && downloadFile(file.id)}
                      >
                        {downloadAttachment.isPending && downloadAttachment.variables?.attachmentId === file.id
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <Download className="mr-1.5 h-3.5 w-3.5" />}
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {attachments.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Attachments
                </p>
                <ul className="space-y-1.5">
                  {attachments.map((f, i) => (
                    <li
                      key={f.id ?? i}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm truncate capitalize">{f.kind || "Attachment"}</p>
                          {f.uploaded_at && (
                            <p className="text-[11px] text-muted-foreground">
                              {fmt(
                                f.uploaded_at,
                                "MMM dd, HH:mm",
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {f.url
                        ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs shrink-0"
                            >
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open
                              </a>
                            </Button>
                          )
                        : (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              Preview unavailable
                            </span>
                          )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          {/* ── 4 · Contact Information ── */}
          {visibleContacts.length > 0 && (
            <SectionCard
              title="Contact Information"
              icon={Phone}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleContacts.map(c => (
                  <div
                    key={`${c.label}-${c.stop?.address}`}
                    className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </p>
                    {c.stop?.contact_name && (
                      <p className="text-sm font-medium">{c.stop.contact_name}</p>
                    )}
                    {c.stop?.company_name && (
                      <p className="text-xs text-muted-foreground">{c.stop.company_name}</p>
                    )}
                    {c.stop?.contact_phone && (
                      <p className="text-xs">{c.stop.contact_phone}</p>
                    )}
                    {(c.stop?.date || c.stop?.time_from || c.stop?.time_to) && !(c.start || c.end) && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>
                          {[
                            c.stop?.date,
                            [
                              c.stop?.time_from,
                              c.stop?.time_to,
                            ].filter(Boolean).join(" – "),
                          ].filter(Boolean).join(" · ")}
                        </span>
                      </p>
                    )}
                    {(c.start || c.end) && (
                      <>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            {fmt(
                              c.start ?? c.end,
                              "yyyy-MM-dd",
                            )}
                          </span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            Preferred Time Range:
                            {" "}
                            {fmt(
                              c.start,
                              "HH:mm",
                            ) ?? "—"}
                            {" "}
                            –
                            {" "}
                            {fmt(
                              c.end,
                              "HH:mm",
                            ) ?? "—"}
                          </span>
                        </p>
                      </>
                    )}
                    {c.stop?.address && (
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="break-words">{c.stop.address}</span>
                      </p>
                    )}
                    {c.stop?.notes && (
                      <div className="pt-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Instructions
                        </p>
                        <p className="text-xs break-words">{c.stop.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <JobTimeline job={job} />
        </div>
      </DialogContent>
      <CancelJobDialog
        job={cancelTarget}
        onOpenChange={open => !open && setCancelTarget(null)}
      />
    </Dialog>
  );
}
