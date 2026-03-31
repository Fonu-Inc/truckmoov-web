import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  MapPin,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type IncidentType = "breakdown" | "accident" | "delay";
type IncidentSeverity = "low" | "medium" | "high";
type IncidentStatus = "open" | "investigating" | "resolved";

type Incident = {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  vehicle: string;
  driver: string;
  location: string;
  description: string;
  status: IncidentStatus;
  reportedAt: string;
};

const INCIDENT_SCHEMA = z.object({
  type: z.enum(["breakdown", "accident", "delay"]),
  severity: z.enum(["low", "medium", "high"]),
  vehicle: z.string().min(1, "Vehicle is required"),
  driver: z.string().min(1, "Driver is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Provide a brief description (min 10 characters)."),
});

type IncidentFormValues = z.infer<typeof INCIDENT_SCHEMA>;

const TYPE_STYLES: Record<IncidentType, string> = {
  breakdown: "bg-warning/10 text-warning border-warning/30",
  accident: "bg-destructive/10 text-destructive border-destructive/30",
  delay: "bg-primary/10 text-primary border-primary/30",
};

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  low: "bg-muted text-muted-foreground border-muted",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_STYLES: Record<IncidentStatus, string> = {
  open: "bg-primary/10 text-primary border-primary/30",
  investigating: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/30",
};

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-2041",
    type: "breakdown",
    severity: "high",
    vehicle: "TMV-401",
    driver: "Kemi Ojo",
    location: "Third Mainland Bridge",
    description: "Engine overheating, awaiting support.",
    status: "open",
    reportedAt: "2026-03-31T07:42:00Z",
  },
  {
    id: "INC-2040",
    type: "delay",
    severity: "medium",
    vehicle: "TMV-118",
    driver: "Tunde Balogun",
    location: "Apapa Port",
    description: "Queue delay at gate 3.",
    status: "investigating",
    reportedAt: "2026-03-31T06:20:00Z",
  },
  {
    id: "INC-2039",
    type: "accident",
    severity: "high",
    vehicle: "TMV-090",
    driver: "Bode Adebayo",
    location: "Ikorodu Road",
    description: "Minor collision, no injuries reported.",
    status: "resolved",
    reportedAt: "2026-03-30T15:05:00Z",
  },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

function IncidentReportDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: IncidentFormValues) => void;
}) {
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(INCIDENT_SCHEMA),
    defaultValues: {
      type: "breakdown",
      severity: "medium",
      vehicle: "",
      driver: "",
      location: "",
      description: "",
    },
  });

  const handleSubmit = (values: IncidentFormValues) => {
    onCreate(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
          <DialogDescription>Log breakdowns, accidents, or delays for immediate action.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakdown">Breakdown</SelectItem>
                          <SelectItem value="accident">Accident</SelectItem>
                          <SelectItem value="delay">Delay</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
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
                control={form.control}
                name="vehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TMV-401" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="driver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kemi Ojo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Where did this occur?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Add context, impact, and next steps..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Incident
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [reportOpen, setReportOpen] = useState(false);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesType = typeFilter === "all" || incident.type === typeFilter;
      const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
      const matchesSearch = !query
        || incident.id.toLowerCase().includes(query)
        || incident.vehicle.toLowerCase().includes(query)
        || incident.driver.toLowerCase().includes(query)
        || incident.location.toLowerCase().includes(query);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [incidents, search, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    return incidents.reduce(
      (acc, incident) => {
        acc.total += 1;
        if (incident.status === "open") acc.open += 1;
        if (incident.severity === "high") acc.high += 1;
        return acc;
      },
      { total: 0, open: 0, high: 0 }
    );
  }, [incidents]);

  const updateStatus = (id: string, status: IncidentStatus) => {
    setIncidents((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleCreate = (payload: IncidentFormValues) => {
    const created: Incident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      status: "open",
      reportedAt: new Date().toISOString(),
      ...payload,
    };
    setIncidents((prev) => [created, ...prev]);
  };

  const columns: ColumnDef<Incident>[] = [
    {
      accessorKey: "id",
      header: "Incident",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.id}</p>
          <p className="text-xs text-muted-foreground">{row.original.vehicle}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", TYPE_STYLES[row.original.type])}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", SEVERITY_STYLES[row.original.severity])}>
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: "driver",
      header: "Driver",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.driver}</p>
          <p className="text-xs text-muted-foreground">{row.original.location}</p>
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
      accessorKey: "reportedAt",
      header: "Reported",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          {formatDateTime(row.original.reportedAt)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "investigating")}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Mark investigating
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "resolved")}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Resolve incident
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "open")}>
              <MapPin className="mr-2 h-4 w-4" />
              Reopen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total incidents</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open incidents</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.open}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High severity</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.high}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Incident Reports</CardTitle>
            <CardDescription>Capture breakdowns, accidents, and delay reasons for fast response.</CardDescription>
          </div>
          <Button onClick={() => setReportOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Incident
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search by incident, driver, vehicle, location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-sm"
            />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as IncidentType | "all")}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="breakdown">Breakdown</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="delay">Delay</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IncidentStatus | "all")}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredIncidents}
            noResultStatement="No incident reports found."
          />
        </CardContent>
      </Card>

      <IncidentReportDialog open={reportOpen} onOpenChange={setReportOpen} onCreate={handleCreate} />
    </section>
  );
}
