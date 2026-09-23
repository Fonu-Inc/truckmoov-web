import type {
  SupportTicketCategory,
  SupportTicketPriority,
} from "@truckmoov/api/auth";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketsQueryOptions,
  useCreateSupportTicket,
} from "@truckmoov/api/auth";
import {
  ArrowLeft,
  Cpu,
  HelpCircle,
  Lightbulb,
  MapPin,
  Truck,
  Wifi,
  Wrench,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import {
  useJobsStore,
  useMyJobs,
} from "@/features/jobs/stores/jobsStore";

type SupportCategory = {
  id: string;
  label: string;
  description: string;
  icon: ElementType;
  /** The API category this maps to. */
  apiCategory: SupportTicketCategory;
  issues: string[];
};

const CATEGORIES: SupportCategory[] = [
  {
    id: "device",
    label: "Device & Hardware",
    description: "Faulty, damaged or unresponsive devices.",
    icon: Cpu,
    apiCategory: "device_tracking",
    issues: [
      "Device will not power on",
      "Device damaged on arrival",
      "Wrong device supplied",
      "Device not communicating",
    ],
  },
  {
    id: "config",
    label: "Configuration & Setup",
    description: "Problems configuring or verifying a device.",
    icon: Wrench,
    apiCategory: "device_tracking",
    issues: [
      "Configuration keeps failing",
      "Device stuck in config pending",
      "Verification never completes",
      "Wrong settings for this model",
    ],
  },
  {
    id: "sim",
    label: "SIM & Connectivity",
    description: "SIM activation and network problems.",
    icon: Wifi,
    apiCategory: "sim_connectivity",
    issues: [
      "SIM will not activate",
      "No network on site",
      "SIM missing from the kit",
      "Data not reaching the platform",
    ],
  },
  {
    id: "job",
    label: "Job & Scheduling",
    description: "Job details, timing or assignment.",
    icon: Truck,
    apiCategory: "other",
    issues: [
      "Wrong job details",
      "Customer unavailable",
      "Need to reschedule",
      "Job assigned in error",
    ],
  },
  {
    id: "site",
    label: "Site Access & Safety",
    description: "Access, safety or on-site obstruction.",
    icon: MapPin,
    apiCategory: "other",
    issues: [
      "Cannot access the site",
      "Unsafe working conditions",
      "Vehicle not available",
      "Wrong address",
    ],
  },
  {
    id: "account",
    label: "My Account & Tools",
    description: "Sign-in, profile or portal problems.",
    icon: HelpCircle,
    apiCategory: "account_access",
    issues: [
      "Cannot sign in",
      "Wrong details on my profile",
      "Portal not loading",
      "Something else",
    ],
  },
];

const PRIORITIES: SupportTicketPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export default function SupportPage() {
  const installer = useJobsStore(s => s.installer);
  const myJobs = useMyJobs();
  const createTicket = useCreateSupportTicket();

  const [
    tab,
    setTab,
  ] = useState("report");
  const [
    selected,
    setSelected,
  ] = useState<SupportCategory | null>(null);
  const [
    issue,
    setIssue,
  ] = useState("");
  const [
    jobId,
    setJobId,
  ] = useState("");
  const [
    priority,
    setPriority,
  ] = useState<SupportTicketPriority>("medium");
  const [
    details,
    setDetails,
  ] = useState("");

  const ticketsQuery = useQuery(getSupportTicketsQueryOptions());
  const tickets = ticketsQuery.data?.data?.tickets ?? [];

  const activeJobs = useMemo(
    () => myJobs.filter(j => !["completed"].includes(j.status)),
    [myJobs],
  );

  const reset = () => {
    setSelected(null);
    setIssue("");
    setJobId("");
    setPriority("medium");
    setDetails("");
  };

  const submit = () => {
    if (!selected)
      return;
    if (!issue) {
      toast.error("Select what went wrong.");
      return;
    }
    if (details.trim().length < 10) {
      toast.error("Describe the problem in a little more detail.");
      return;
    }

    createTicket.mutate(
      {
        data: {
          subject: `${selected.label}: ${issue}`,
          description: jobId ? `${details}\n\nRelated job: ${jobId}` : details,
          category: selected.apiCategory,
          priority,
        },
      },
      {
        onSuccess: () => {
          toast.success("Support ticket submitted.");
          reset();
          setTab("tickets");
          void ticketsQuery.refetch();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="space-y-6"
    >
      <TabsList>
        <TabsTrigger value="report">Report an Issue</TabsTrigger>
        <TabsTrigger value="tickets">My Tickets</TabsTrigger>
      </TabsList>

      <TabsContent
        value="report"
        className="space-y-6"
      >
        {selected
          ? (
              <Card>
                <CardHeader>
                  <Button
                    variant="ghost"
                    className="w-fit gap-2 px-0"
                    onClick={reset}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {" "}
                    All categories
                  </Button>
                  <CardTitle>{selected.label}</CardTitle>
                  <CardDescription>{selected.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>What went wrong?</Label>
                    <div className="flex flex-wrap gap-2">
                      {selected.issues.map(i => (
                        <Badge
                          key={i}
                          variant={issue === i ? "default" : "outline"}
                          className="cursor-pointer rounded-full"
                          onClick={() => setIssue(i)}
                        >
                          {i}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Related job</Label>
                      <Select
                        value={jobId}
                        onValueChange={setJobId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeJobs.map(j => (
                            <SelectItem
                              key={j.id}
                              value={j.id}
                            >
                              {j.id}
                              {" — "}
                              {j.customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Urgency</Label>
                      <Select
                        value={priority}
                        onValueChange={v => setPriority(v as SupportTicketPriority)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map(p => (
                            <SelectItem
                              key={p}
                              value={p}
                              className="capitalize"
                            >
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Details</Label>
                    <Textarea
                      rows={5}
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder="Tell us what happened on site"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Callback number</Label>
                    <Input
                      value={installer.phone}
                      disabled
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      onClick={reset}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submit}
                      loading={createTicket.isPending}
                    >
                      Submit Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CATEGORIES.map(c => (
                    <Card
                      key={c.id}
                      className="cursor-pointer transition-colors hover:border-primary/50"
                      onClick={() => setSelected(c)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <c.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{c.label}</p>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      {" "}
                      Field tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Check the device has power and a clear view of the sky before reporting a fault.</p>
                    <p>Photograph the IMEI and the installed position — it speeds up every support ticket.</p>
                    <p>If the customer is unavailable, report the job issue rather than leaving it open.</p>
                  </CardContent>
                </Card>
              </>
            )}
      </TabsContent>

      <TabsContent value="tickets">
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>Support tickets you have raised.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketsQuery.isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        Loading tickets…
                      </TableCell>
                    </TableRow>
                  )}
                  {ticketsQuery.isError && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm"
                      >
                        <p className="text-muted-foreground">Unable to load your tickets.</p>
                        <Button
                          variant="link"
                          onClick={() => ticketsQuery.refetch()}
                        >
                          Try again
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell className="capitalize">
                        {t.category.replace(
                          /_/g,
                          " ",
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{t.priority}</TableCell>
                      <TableCell className="capitalize">
                        {t.status.replace(
                          /_/g,
                          " ",
                        )}
                      </TableCell>
                      <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center"
                      >
                        <p className="text-sm font-medium">No tickets yet</p>
                        <p className="text-xs text-muted-foreground">
                          Report an issue and it will appear here.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
