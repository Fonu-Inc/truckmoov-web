import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Download, FileText, ShieldAlert, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ExportStatus = "queued" | "processing" | "completed";

type ExportRequest = {
  id: string;
  scope: string;
  format: string;
  range: string;
  delivery: string;
  status: ExportStatus;
  requestedAt: string;
};

type DeletionStatus = "pending" | "approved" | "completed";

type DeletionRequest = {
  id: string;
  subjectType: string;
  subjectId: string;
  scope: string;
  reason: string;
  status: DeletionStatus;
  requestedAt: string;
};

const EXPORT_SCHEMA = z.object({
  scope: z.enum(["jobs", "tracking", "drivers", "communications", "billing"]),
  format: z.enum(["csv", "pdf"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  delivery: z.enum(["email", "download"]),
  includeAttachments: z.boolean().default(false),
});

type ExportFormValues = z.infer<typeof EXPORT_SCHEMA>;

const DELETION_SCHEMA = z.object({
  subjectType: z.enum(["user", "driver", "vehicle", "customer"]),
  subjectId: z.string().min(1, "Identifier is required"),
  scope: z.enum(["full", "tracking", "communications"]),
  reason: z.string().min(10, "Provide a clear reason (min 10 characters)."),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the deletion request." }),
  }),
});

type DeletionFormValues = z.infer<typeof DELETION_SCHEMA>;

const EXPORT_STATUS_STYLES: Record<ExportStatus, string> = {
  queued: "bg-warning/10 text-warning border-warning/30",
  processing: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
};

const DELETION_STATUS_STYLES: Record<DeletionStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
};

const INITIAL_EXPORTS: ExportRequest[] = [
  {
    id: "EXP-3012",
    scope: "Tracking",
    format: "CSV",
    range: "2026-03-01 to 2026-03-30",
    delivery: "Email",
    status: "processing",
    requestedAt: "2026-03-31T06:15:00Z",
  },
  {
    id: "EXP-3011",
    scope: "Jobs",
    format: "PDF",
    range: "2026-02-01 to 2026-02-28",
    delivery: "Download",
    status: "completed",
    requestedAt: "2026-03-01T11:04:00Z",
  },
];

const INITIAL_DELETIONS: DeletionRequest[] = [
  {
    id: "DEL-902",
    subjectType: "Driver",
    subjectId: "DRV-1104",
    scope: "Tracking",
    reason: "Driver contract terminated, remove tracking history.",
    status: "pending",
    requestedAt: "2026-03-30T09:30:00Z",
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

export default function DataComplianceSettings() {
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>(INITIAL_EXPORTS);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(INITIAL_DELETIONS);

  const exportForm = useForm<ExportFormValues>({
    resolver: zodResolver(EXPORT_SCHEMA),
    defaultValues: {
      scope: "jobs",
      format: "csv",
      startDate: "",
      endDate: "",
      delivery: "email",
      includeAttachments: false,
    },
  });

  const deletionForm = useForm<DeletionFormValues>({
    resolver: zodResolver(DELETION_SCHEMA),
    defaultValues: {
      subjectType: "user",
      subjectId: "",
      scope: "full",
      reason: "",
      confirm: false,
    },
  });

  const exportColumns: ColumnDef<ExportRequest>[] = [
    {
      accessorKey: "id",
      header: "Request",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.id}</p>
          <p className="text-xs text-muted-foreground">{row.original.scope}</p>
        </div>
      ),
    },
    {
      accessorKey: "range",
      header: "Range",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.range}</span>,
    },
    {
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => <Badge variant="outline">{row.original.format}</Badge>,
    },
    {
      accessorKey: "delivery",
      header: "Delivery",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.delivery}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", EXPORT_STATUS_STYLES[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.requestedAt)}</span>,
    },
  ];

  const deletionColumns: ColumnDef<DeletionRequest>[] = [
    {
      accessorKey: "id",
      header: "Request",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.id}</p>
          <p className="text-xs text-muted-foreground">{row.original.subjectType}</p>
        </div>
      ),
    },
    {
      accessorKey: "subjectId",
      header: "Identifier",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.subjectId}</span>,
    },
    {
      accessorKey: "scope",
      header: "Scope",
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.scope}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", DELETION_STATUS_STYLES[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.requestedAt)}</span>,
    },
  ];

  const exportSummary = useMemo(() => {
    const queued = exportRequests.filter((item) => item.status !== "completed").length;
    return { total: exportRequests.length, queued };
  }, [exportRequests]);

  const deletionSummary = useMemo(() => {
    const pending = deletionRequests.filter((item) => item.status !== "completed").length;
    return { total: deletionRequests.length, pending };
  }, [deletionRequests]);

  const handleExportSubmit = (values: ExportFormValues) => {
    const created: ExportRequest = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      scope: values.scope.toUpperCase(),
      format: values.format.toUpperCase(),
      range: `${values.startDate} to ${values.endDate}`,
      delivery: values.delivery === "email" ? "Email" : "Download",
      status: "queued",
      requestedAt: new Date().toISOString(),
    };
    setExportRequests((prev) => [created, ...prev]);
    exportForm.reset({
      scope: "jobs",
      format: "csv",
      startDate: "",
      endDate: "",
      delivery: "email",
      includeAttachments: false,
    });
  };

  const handleDeletionSubmit = (values: DeletionFormValues) => {
    const created: DeletionRequest = {
      id: `DEL-${Date.now().toString().slice(-3)}`,
      subjectType: values.subjectType,
      subjectId: values.subjectId,
      scope: values.scope,
      reason: values.reason,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    setDeletionRequests((prev) => [created, ...prev]);
    deletionForm.reset({
      subjectType: "user",
      subjectId: "",
      scope: "full",
      reason: "",
      confirm: false,
    });
  };

  return (
    <section className="space-y-6">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Compliance tooling</AlertTitle>
        <AlertDescription>
          Export and deletion requests are logged for audit trails. Approved deletions are irreversible.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>Generate compliance-ready exports for auditors or customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total requests</p>
                <p className="text-2xl font-semibold">{exportSummary.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In queue</p>
                <p className="text-2xl font-semibold">{exportSummary.queued}</p>
              </div>
            </div>

            <Form {...exportForm}>
              <form className="space-y-4" onSubmit={exportForm.handleSubmit(handleExportSubmit)}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={exportForm.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data scope</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jobs">Jobs</SelectItem>
                              <SelectItem value="tracking">Tracking</SelectItem>
                              <SelectItem value="drivers">Drivers</SelectItem>
                              <SelectItem value="communications">Communications</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={exportForm.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={exportForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={exportForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={exportForm.control}
                    name="delivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Delivery method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="download">Download</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={exportForm.control}
                    name="includeAttachments"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div>
                          <FormLabel>Include attachments</FormLabel>
                          <p className="text-sm text-muted-foreground">Bundle documents and receipts with the export.</p>
                        </div>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={exportForm.formState.isSubmitting}>
                    <Download className="mr-2 h-4 w-4" />
                    Create export
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Deletion
            </CardTitle>
            <CardDescription>Log deletion requests and maintain audit-proof approvals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total requests</p>
                <p className="text-2xl font-semibold">{deletionSummary.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{deletionSummary.pending}</p>
              </div>
            </div>

            <Form {...deletionForm}>
              <form className="space-y-4" onSubmit={deletionForm.handleSubmit(handleDeletionSubmit)}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={deletionForm.control}
                    name="subjectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="driver">Driver</SelectItem>
                              <SelectItem value="vehicle">Vehicle</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deletionForm.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifier</FormLabel>
                        <FormControl>
                          <Input placeholder="User ID, email, or reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={deletionForm.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deletion scope</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full data removal</SelectItem>
                            <SelectItem value="tracking">Tracking history only</SelectItem>
                            <SelectItem value="communications">Communications only</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deletionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Explain why deletion is required." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deletionForm.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 rounded-lg border border-destructive/30 p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                      </FormControl>
                      <div>
                        <FormLabel>Confirm irreversible deletion</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This action permanently removes data once approved.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" isLoading={deletionForm.formState.isSubmitting} variant="destructive">
                    <FileText className="mr-2 h-4 w-4" />
                    Submit deletion request
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Requests</CardTitle>
          <CardDescription>Track recent export requests and delivery status.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={exportColumns} data={exportRequests} noResultStatement="No export requests yet." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deletion Requests</CardTitle>
          <CardDescription>Monitor compliance deletions awaiting approval or completion.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={deletionColumns} data={deletionRequests} noResultStatement="No deletion requests yet." />
        </CardContent>
      </Card>
    </section>
  );
}
