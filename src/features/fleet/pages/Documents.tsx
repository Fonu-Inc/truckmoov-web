import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const DOCUMENT_TYPES = [
  "Insurance",
  "Roadworthiness",
  "Cargo Permit",
  "Safety Certificate",
  "Emissions Test",
  "Driver License",
  "Medical Certificate",
];

const STATUS_STYLES: Record<ComplianceStatus, string> = {
  valid: "bg-success/20 text-success border-success/30",
  expiring: "bg-warning/20 text-warning border-warning/30",
  expired: "bg-destructive/20 text-destructive border-destructive/30",
};

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const REMINDER_DEFAULT_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ComplianceStatus = "valid" | "expiring" | "expired";

type AuditEntry = {
  id: string;
  action: string;
  actor: string;
  at: string;
  note?: string;
};

type ComplianceDocument = {
  id: string;
  entityType: "vehicle" | "driver";
  entityName: string;
  documentType: string;
  documentNumber: string;
  issueDate?: string;
  expiryDate: string;
  reminderDays: number;
  fileName?: string;
  fileSize?: number;
  lastReminderAt?: string;
  lastRenewedAt?: string;
  auditTrail: AuditEntry[];
};

type ComplianceRow = ComplianceDocument & {
  status: ComplianceStatus;
  daysToExpiry: number;
};

const INITIAL_DOCUMENTS: ComplianceDocument[] = [
  {
    id: "DOC-401",
    entityType: "vehicle",
    entityName: "TMV-201",
    documentType: "Insurance",
    documentNumber: "INS-4821",
    issueDate: "2026-01-15",
    expiryDate: "2026-08-15",
    reminderDays: 30,
    fileName: "tmv-201-insurance.pdf",
    fileSize: 248000,
    auditTrail: [
      {
        id: "AUD-9101",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-01-15T09:00:00Z",
        note: "Uploaded initial insurance certificate.",
      },
    ],
  },
  {
    id: "DOC-402",
    entityType: "vehicle",
    entityName: "TMV-402",
    documentType: "Roadworthiness",
    documentNumber: "RDW-7783",
    issueDate: "2025-11-20",
    expiryDate: "2026-04-10",
    reminderDays: 30,
    fileName: "tmv-402-roadworthiness.pdf",
    fileSize: 182000,
    lastReminderAt: "2026-03-20T08:30:00Z",
    auditTrail: [
      {
        id: "AUD-9102",
        action: "created",
        actor: "Fleet Admin",
        at: "2025-11-20T15:10:00Z",
      },
      {
        id: "AUD-9103",
        action: "reminder sent",
        actor: "Fleet Admin",
        at: "2026-03-20T08:30:00Z",
        note: "Email reminder sent to compliance@lagosexpress.com",
      },
    ],
  },
  {
    id: "DOC-403",
    entityType: "driver",
    entityName: "Amina Yusuf",
    documentType: "Driver License",
    documentNumber: "DL-90211",
    issueDate: "2024-03-10",
    expiryDate: "2026-03-10",
    reminderDays: 45,
    fileName: "amina-yusuf-license.pdf",
    fileSize: 98000,
    auditTrail: [
      {
        id: "AUD-9104",
        action: "created",
        actor: "Fleet Admin",
        at: "2024-03-10T11:00:00Z",
      },
    ],
  },
  {
    id: "DOC-404",
    entityType: "vehicle",
    entityName: "TMV-318",
    documentType: "Cargo Permit",
    documentNumber: "CP-1189",
    issueDate: "2025-05-01",
    expiryDate: "2026-05-01",
    reminderDays: 20,
    fileName: "tmv-318-cargo-permit.pdf",
    fileSize: 156000,
    auditTrail: [
      {
        id: "AUD-9105",
        action: "created",
        actor: "Fleet Admin",
        at: "2025-05-01T14:20:00Z",
      },
    ],
  },
  {
    id: "DOC-405",
    entityType: "driver",
    entityName: "Seyi Okafor",
    documentType: "Medical Certificate",
    documentNumber: "MED-5541",
    issueDate: "2025-10-02",
    expiryDate: "2026-04-02",
    reminderDays: 14,
    auditTrail: [
      {
        id: "AUD-9106",
        action: "created",
        actor: "Fleet Admin",
        at: "2025-10-02T09:45:00Z",
      },
    ],
  },
];

const COMPLIANCE_SCHEMA = z.object({
  entityType: z.enum(["vehicle", "driver"]),
  entityName: z.string().min(1, "Enter a vehicle or driver name."),
  documentType: z.string().min(1, "Select a document type."),
  documentNumber: z.string().min(1, "Document number is required."),
  issueDate: z.string().optional(),
  expiryDate: z.string().min(1, "Select an expiry date."),
  reminderDays: z.number().min(1, "Reminder days must be at least 1.").max(365, "Max 365 days."),
});

type ComplianceFormValues = z.infer<typeof COMPLIANCE_SCHEMA>;

const RENEW_SCHEMA = z.object({
  expiryDate: z.string().min(1, "Select a new expiry date."),
  note: z.string().optional(),
});

type RenewFormValues = z.infer<typeof RENEW_SCHEMA>;

const REMINDER_SCHEMA = z.object({
  reminderDays: z.number().min(1, "Reminder days must be at least 1.").max(365, "Max 365 days."),
});

type ReminderFormValues = z.infer<typeof REMINDER_SCHEMA>;

const SEND_REMINDER_SCHEMA = z.object({
  channel: z.enum(["email", "whatsapp"]),
  recipient: z.string().min(1, "Recipient is required."),
  message: z.string().optional(),
});

type SendReminderValues = z.infer<typeof SEND_REMINDER_SCHEMA>;

const UPLOAD_SCHEMA = z.object({
  note: z.string().optional(),
});

type UploadValues = z.infer<typeof UPLOAD_SCHEMA>;

function createId(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value?: string) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : "N/A";
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

function toDateInput(value?: string) {
  return value ?? "";
}

function formatBytes(bytes?: number): string {
  if (!Number.isFinite(bytes) || !bytes || bytes <= 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getDaysToExpiry(expiryDate: string): number {
  const expiry = parseDate(expiryDate);
  if (!expiry) return 0;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const diffMs = expiry.getTime() - todayUtc.getTime();
  return Math.ceil(diffMs / MS_PER_DAY);
}

function getStatus(expiryDate: string, reminderDays: number): ComplianceStatus {
  const daysToExpiry = getDaysToExpiry(expiryDate);
  if (daysToExpiry < 0) return "expired";
  if (daysToExpiry <= reminderDays) return "expiring";
  return "valid";
}

function buildAuditEntry(action: string, actor: string, note?: string): AuditEntry {
  return {
    id: createId("AUD"),
    action,
    actor,
    at: new Date().toISOString(),
    note,
  };
}

function getExpiryLabel(daysToExpiry: number) {
  if (daysToExpiry < 0) return `Expired ${Math.abs(daysToExpiry)} days ago`;
  if (daysToExpiry === 0) return "Expires today";
  if (daysToExpiry === 1) return "Expires in 1 day";
  return `Expires in ${daysToExpiry} days`;
}

function ComplianceDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ComplianceFormValues, file: File | null) => void;
}) {
  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(COMPLIANCE_SCHEMA),
    defaultValues: {
      entityType: "vehicle",
      entityName: "",
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      reminderDays: REMINDER_DEFAULT_DAYS,
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (open) {
      form.reset({
        entityType: "vehicle",
        entityName: "",
        documentType: "",
        documentNumber: "",
        issueDate: "",
        expiryDate: "",
        reminderDays: REMINDER_DEFAULT_DAYS,
      });
      setFile(null);
      setFileInputKey((prev) => prev + 1);
    }
  }, [open, form]);

  const handleSubmit = (values: ComplianceFormValues) => {
    onSubmit(values, file);
    form.reset();
    setFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register Compliance Document</DialogTitle>
          <DialogDescription>Capture compliance details for a vehicle or driver.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle or Driver</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TMV-201 or Amina Yusuf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ID or reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reminderDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        {...field}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          field.onChange(Number.isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Upload file (optional)</p>
              </div>
              <div className="mt-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {file.name} ({formatBytes(file.size)})
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No file selected.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Save document
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RenewDocumentDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ComplianceDocument | null;
  onSubmit: (values: RenewFormValues, file: File | null) => void;
}) {
  const form = useForm<RenewFormValues>({
    resolver: zodResolver(RENEW_SCHEMA),
    defaultValues: {
      expiryDate: "",
      note: "",
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    form.reset({
      expiryDate: document ? toDateInput(document.expiryDate) : "",
      note: "",
    });
    setFile(null);
    setFileInputKey((prev) => prev + 1);
  }, [open, document, form]);

  if (!document) return null;

  const handleSubmit = (values: RenewFormValues) => {
    onSubmit(values, file);
    form.reset();
    setFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Renew Document</DialogTitle>
          <DialogDescription>Update expiry date and attach a renewal file.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Renewal file (optional)</p>
              </div>
              <div className="mt-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {file.name} ({formatBytes(file.size)})
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No file selected.</p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renewal Note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Add renewal context (optional)." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Confirm renewal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReminderDaysDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ComplianceDocument | null;
  onSubmit: (values: ReminderFormValues) => void;
}) {
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(REMINDER_SCHEMA),
    defaultValues: {
      reminderDays: REMINDER_DEFAULT_DAYS,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reminderDays: document?.reminderDays ?? REMINDER_DEFAULT_DAYS });
    }
  }, [open, document, form]);

  if (!document) return null;

  const handleSubmit = (values: ReminderFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Reminder Days</DialogTitle>
          <DialogDescription>Configure how early to flag this document.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="reminderDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      {...field}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        field.onChange(Number.isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Save reminder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SendReminderDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ComplianceDocument | null;
  onSubmit: (values: SendReminderValues) => void;
}) {
  const form = useForm<SendReminderValues>({
    resolver: zodResolver(SEND_REMINDER_SCHEMA),
    defaultValues: {
      channel: "email",
      recipient: "",
      message: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        channel: "email",
        recipient: "",
        message: `Reminder: ${document?.documentType ?? "Compliance document"} expires on ${document ? formatDate(document.expiryDate) : ""}.`,
      });
    }
  }, [open, document, form]);

  if (!document) return null;

  const handleSubmit = (values: SendReminderValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Reminder</DialogTitle>
          <DialogDescription>Notify a recipient about this expiring document.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input placeholder="Email or WhatsApp number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Send reminder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UploadFileDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ComplianceDocument | null;
  onSubmit: (values: UploadValues, file: File | null) => void;
}) {
  const form = useForm<UploadValues>({
    resolver: zodResolver(UPLOAD_SCHEMA),
    defaultValues: {
      note: "",
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (open) {
      form.reset({ note: "" });
      setFile(null);
      setFileInputKey((prev) => prev + 1);
    }
  }, [open, form]);

  if (!document) return null;

  const handleSubmit = (values: UploadValues) => {
    onSubmit(values, file);
    form.reset();
    setFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Compliance File</DialogTitle>
          <DialogDescription>Attach evidence for this compliance document.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Select file</p>
              </div>
              <div className="mt-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {file.name} ({formatBytes(file.size)})
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No file selected.</p>
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Note</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Add any upload context (optional)." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" isLoading={form.formState.isSubmitting} disabled={!file}>
                Attach file
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DocumentDetailsDialog({
  open,
  onOpenChange,
  document,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ComplianceRow | null;
}) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compliance Document Details</DialogTitle>
          <DialogDescription>Review document status, reminders, and audit trail.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium">{document.documentType}</p>
              <p className="text-xs text-muted-foreground">{document.documentNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="font-medium">{document.entityName}</p>
              <p className="text-xs text-muted-foreground capitalize">{document.entityType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(document.issueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="font-medium">{formatDate(document.expiryDate)}</p>
              <p className="text-xs text-muted-foreground">{getExpiryLabel(document.daysToExpiry)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className={cn("mt-1 capitalize", STATUS_STYLES[document.status])}>
                {document.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reminder Days</p>
              <p className="font-medium">{document.reminderDays} days</p>
              <p className="text-xs text-muted-foreground">
                {document.lastReminderAt ? `Last reminder ${formatDateTime(document.lastReminderAt)}` : "No reminders sent"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File</p>
              <p className="font-medium">{document.fileName ?? "No file"}</p>
              {document.fileSize ? (
                <p className="text-xs text-muted-foreground">{formatBytes(document.fileSize)}</p>
              ) : null}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Renewed</p>
              <p className="font-medium">{document.lastRenewedAt ? formatDateTime(document.lastRenewedAt) : "Not renewed"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Audit Trail</p>
            <div className="mt-2 space-y-2">
              {document.auditTrail.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {entry.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.actor}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</span>
                  </div>
                  {entry.note ? <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const { user } = useAuthStore();
  const role = user?.role;
  const actorName = user?.profile?.fullName ?? user?.email ?? "Current User";

  const isFleetAdmin = role === "FLEET_ADMIN";
  const isOpsAnalyst = role === "OPERATIONS_MANAGER";

  const [documents, setDocuments] = useState<ComplianceDocument[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const documentsWithStatus = useMemo<ComplianceRow[]>(() => {
    return documents.map((doc) => {
      const daysToExpiry = getDaysToExpiry(doc.expiryDate);
      return {
        ...doc,
        status: getStatus(doc.expiryDate, doc.reminderDays),
        daysToExpiry,
      };
    });
  }, [documents]);

  const activeDocument = useMemo(
    () => documents.find((doc) => doc.id === activeDocumentId) ?? null,
    [documents, activeDocumentId],
  );

  const activeDocumentWithStatus = useMemo(
    () => documentsWithStatus.find((doc) => doc.id === activeDocumentId) ?? null,
    [documentsWithStatus, activeDocumentId],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return documentsWithStatus.filter((doc) => {
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
      const matchesSearch = !query
        || doc.documentType.toLowerCase().includes(query)
        || doc.documentNumber.toLowerCase().includes(query)
        || doc.entityName.toLowerCase().includes(query);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [documentsWithStatus, searchQuery, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const total = documentsWithStatus.length;
    const valid = documentsWithStatus.filter((doc) => doc.status === "valid").length;
    const expiring = documentsWithStatus.filter((doc) => doc.status === "expiring").length;
    const expired = documentsWithStatus.filter((doc) => doc.status === "expired").length;
    const coverage = total > 0 ? Math.round((valid / total) * 100) : 0;
    return { total, valid, expiring, expired, coverage };
  }, [documentsWithStatus]);

  const handleCreateDocument = (values: ComplianceFormValues, file: File | null) => {
    const newDoc: ComplianceDocument = {
      id: createId("DOC"),
      entityType: values.entityType,
      entityName: values.entityName,
      documentType: values.documentType,
      documentNumber: values.documentNumber,
      issueDate: values.issueDate || undefined,
      expiryDate: values.expiryDate,
      reminderDays: values.reminderDays,
      fileName: file?.name,
      fileSize: file?.size,
      auditTrail: [
        buildAuditEntry(
          "created",
          actorName,
          file ? `Uploaded file ${file.name}.` : "Document registered without file.",
        ),
      ],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setCreateDialogOpen(false);
  };

  const handleRenewDocument = (values: RenewFormValues, file: File | null) => {
    if (!activeDocument) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== activeDocument.id) return doc;
        return {
          ...doc,
          expiryDate: values.expiryDate,
          lastRenewedAt: new Date().toISOString(),
          fileName: file?.name ?? doc.fileName,
          fileSize: file?.size ?? doc.fileSize,
          auditTrail: [
            buildAuditEntry(
              "renewed",
              actorName,
              values.note || (file ? `Renewal file ${file.name} attached.` : "Expiry updated."),
            ),
            ...doc.auditTrail,
          ],
        };
      }),
    );
    setRenewDialogOpen(false);
  };

  const handleReminderDays = (values: ReminderFormValues) => {
    if (!activeDocument) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== activeDocument.id) return doc;
        return {
          ...doc,
          reminderDays: values.reminderDays,
          auditTrail: [
            buildAuditEntry("reminder updated", actorName, `Reminder set to ${values.reminderDays} days.`),
            ...doc.auditTrail,
          ],
        };
      }),
    );
    setReminderDialogOpen(false);
  };

  const handleSendReminder = (values: SendReminderValues) => {
    if (!activeDocument) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== activeDocument.id) return doc;
        return {
          ...doc,
          lastReminderAt: new Date().toISOString(),
          auditTrail: [
            buildAuditEntry(
              "reminder sent",
              actorName,
              `${values.channel.toUpperCase()} reminder sent to ${values.recipient}.`,
            ),
            ...doc.auditTrail,
          ],
        };
      }),
    );
    setSendDialogOpen(false);
  };

  const handleUploadFile = (values: UploadValues, file: File | null) => {
    if (!activeDocument || !file) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== activeDocument.id) return doc;
        return {
          ...doc,
          fileName: file.name,
          fileSize: file.size,
          auditTrail: [
            buildAuditEntry("file uploaded", actorName, values.note || `File ${file.name} attached.`),
            ...doc.auditTrail,
          ],
        };
      }),
    );
    setUploadDialogOpen(false);
  };

  const handleDownload = (doc: ComplianceDocument) => {
    if (!doc.fileName) return;
    const blob = new Blob([
      `Compliance document placeholder.\nDocument: ${doc.documentType}\nNumber: ${doc.documentNumber}\nAssigned: ${doc.entityName}`,
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDocuments((prev) =>
      prev.map((item) =>
        item.id === doc.id
          ? {
            ...item,
            auditTrail: [
              buildAuditEntry("downloaded", actorName, "Document downloaded for audit."),
              ...item.auditTrail,
            ],
          }
          : item,
      ),
    );
  };

  const columns: ColumnDef<ComplianceRow>[] = [
    {
      accessorKey: "documentType",
      header: "Document",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{row.original.documentType}</p>
            <p className="text-xs text-muted-foreground">{row.original.documentNumber}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "entityName",
      header: "Assigned To",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.entityName}</p>
          <p className="text-xs text-muted-foreground capitalize">{row.original.entityType}</p>
        </div>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{formatDate(row.original.expiryDate)}</p>
          <p className="text-xs text-muted-foreground">{getExpiryLabel(row.original.daysToExpiry)}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "reminderDays",
      header: "Reminder",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.reminderDays} days</span>
      ),
    },
    {
      accessorKey: "fileName",
      header: "File",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.fileName ?? "No file"}</p>
          {row.original.fileSize ? (
            <p className="text-xs text-muted-foreground">{formatBytes(row.original.fileSize)}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setActiveDocumentId(row.original.id);
                setDetailsOpen(true);
              }}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!row.original.fileName}
              onClick={() => handleDownload(row.original)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            {isFleetAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setActiveDocumentId(row.original.id);
                    setUploadDialogOpen(true);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload file
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveDocumentId(row.original.id);
                    setRenewDialogOpen(true);
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Renew document
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveDocumentId(row.original.id);
                    setReminderDialogOpen(true);
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Set reminder days
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveDocumentId(row.original.id);
                    setSendDialogOpen(true);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send reminder
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      {isOpsAnalyst ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Coverage</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{metrics.coverage}%</div>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{metrics.expiring}</div>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{metrics.expired}</div>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{metrics.total}</div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Compliance Documents</CardTitle>
              <CardDescription>Track expiries, reminders, and evidence files.</CardDescription>
            </div>
            {isFleetAdmin ? (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Register document
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search document, number, or entity..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplianceStatus | "all")}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredDocuments}
            noResultStatement={
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                <p className="text-sm">No compliance documents found.</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <ComplianceDocumentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateDocument}
      />

      <RenewDocumentDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        document={activeDocument}
        onSubmit={handleRenewDocument}
      />

      <ReminderDaysDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        document={activeDocument}
        onSubmit={handleReminderDays}
      />

      <SendReminderDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        document={activeDocument}
        onSubmit={handleSendReminder}
      />

      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        document={activeDocument}
        onSubmit={handleUploadFile}
      />

      <DocumentDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        document={activeDocumentWithStatus}
      />
    </section>
  );
}
