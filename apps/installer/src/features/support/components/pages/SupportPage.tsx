import type {
  InstallerIssueType,
  InstallerOptionItem,
  SupportTicketPriority,
} from "@truckmoov/api/auth";
import type {
  ElementType,
  ReactNode,
} from "react";
import {
  getInstallerSupportTicketAttachmentLink,
  useCreateInstallerSupportTicket,
  useInstallerDisplayPreferences,
  useInstallerJobs,
  useInstallerOptions,
  useInstallerProfile,
  useInstallerSupportTicket,
  useInstallerSupportTickets,
} from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowLeft,
  Cpu,
  Download,
  HelpCircle,
  Lightbulb,
  MapPin,
  Truck,
  Wifi,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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

type SupportCategory = {
  /** The API category (POST /auth/installer/support/tickets `category`). */
  key: InstallerIssueType;
  label: string;
  description: string;
  icon: ElementType;
  /** Fallback chip labels, used only when GET /auth/installer/options sends no `issues`. */
  issues: string[];
};

const CATEGORIES: SupportCategory[] = [
  {
    key: "device_hardware",
    label: "Device & Hardware",
    description: "Faulty, damaged or unresponsive devices.",
    icon: Cpu,
    issues: [
      "Device will not power on",
      "Device damaged on arrival",
      "Wrong device supplied",
      "Device not communicating",
    ],
  },
  {
    key: "configuration_setup",
    label: "Configuration & Setup",
    description: "Problems configuring or verifying a device.",
    icon: Wrench,
    issues: [
      "Configuration keeps failing",
      "Device stuck in config pending",
      "Verification never completes",
      "Wrong settings for this model",
    ],
  },
  {
    key: "sim_connectivity",
    label: "SIM & Connectivity",
    description: "SIM activation and network problems.",
    icon: Wifi,
    issues: [
      "SIM will not activate",
      "No network on site",
      "SIM missing from the kit",
      "Data not reaching the platform",
    ],
  },
  {
    key: "job_scheduling",
    label: "Job & Scheduling",
    description: "Job details, timing or assignment.",
    icon: Truck,
    issues: [
      "Wrong job details",
      "Customer unavailable",
      "Need to reschedule",
      "Job assigned in error",
    ],
  },
  {
    key: "site_access_safety",
    label: "Site Access & Safety",
    description: "Access, safety or on-site obstruction.",
    icon: MapPin,
    issues: [
      "Cannot access the site",
      "Unsafe working conditions",
      "Vehicle not available",
      "Wrong address",
    ],
  },
  {
    key: "account_tools",
    label: "My Account & Tools",
    description: "Sign-in, profile or portal problems.",
    icon: HelpCircle,
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

/** A label from the options list, else the key with underscores spaced out. */
function labelOf(list: InstallerOptionItem[] | undefined, key: string) {
  return list?.find(o => o.key === key)?.label ?? key.replace(
    /_/g,
    " ",
  );
}

export default function SupportPage() {
  const [
    tab,
    setTab,
  ] = useState("report");

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
        <ReportIssue onSubmitted={() => setTab("tickets")} />
      </TabsContent>

      <TabsContent value="tickets">
        <MyTickets />
      </TabsContent>
    </Tabs>
  );
}

/** POST /auth/installer/support/tickets. */
function ReportIssue({ onSubmitted }: { onSubmitted: () => void }) {
  const options = useInstallerOptions().data?.data;
  const phone = useInstallerProfile().data?.data.personal.phoneNumber ?? "";
  // ponytail: first 100 active jobs; a search box when installers carry more.
  const jobs = useInstallerJobs({ limit: 100 }).data?.data.items ?? [];
  const createTicket = useCreateInstallerSupportTicket();

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

  const serverCategory = selected && options?.supportCategories.find(c => c.key === selected.key);
  // Server chips carry the `issueCode` key; the fallback labels have none to send.
  const chips: InstallerOptionItem[] = serverCategory?.issues
    ?? selected?.issues.map(label => ({
      key: label,
      label,
    }))
    ?? [];
  const hasServerChips = !!serverCategory?.issues;

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
    if (chips.length && !issue) {
      toast.error("Select what went wrong.");
      return;
    }
    if (details.trim().length < 10) {
      toast.error("Describe the problem in a little more detail.");
      return;
    }
    if (!phone) {
      toast.error("Add a phone number to your profile so the desk can call you back.");
      return;
    }

    createTicket.mutate(
      {
        data: {
          category: selected.key,
          issueCode: hasServerChips ? issue : undefined,
          relatedJobId: jobId || undefined,
          priority,
          // Without server chips the picked label rides along in the description instead.
          description: hasServerChips || !issue ? details : `${issue}\n\n${details}`,
          callbackPhone: phone,
        },
      },
      {
        onSuccess: () => {
          toast.success("Support ticket submitted.");
          reset();
          onSubmitted();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  if (selected) {
    return (
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
          <CardTitle>{serverCategory?.label ?? selected.label}</CardTitle>
          <CardDescription>{selected.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {chips.length > 0 && (
            <div className="space-y-1.5">
              <Label>What went wrong?</Label>
              <div className="flex flex-wrap gap-2">
                {chips.map(c => (
                  <Badge
                    key={c.key}
                    variant={issue === c.key ? "default" : "outline"}
                    className="cursor-pointer rounded-full"
                    onClick={() => setIssue(c.key)}
                  >
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
                  {jobs.map(j => (
                    <SelectItem
                      key={j.id}
                      value={j.id}
                    >
                      {j.jobNumber}
                      {j.companyName && ` — ${j.companyName}`}
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
                      {labelOf(
                        options?.priorities,
                        p,
                      )}
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
              maxLength={4000}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Tell us what happened on site"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Callback number</Label>
            <Input
              value={phone}
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
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(c => (
          <Card
            key={c.key}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => setSelected(c)}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{options?.supportCategories.find(o => o.key === c.key)?.label ?? c.label}</p>
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
          {(options?.fieldTips ?? []).map(tip => <p key={tip}>{tip}</p>)}
        </CardContent>
      </Card>
    </>
  );
}

/** GET /auth/installer/support/tickets. ponytail: first page only; add paging and filters when needed. */
function MyTickets() {
  const options = useInstallerOptions().data?.data;
  const zone = useInstallerDisplayPreferences().data?.data.timezone;
  const ticketsQuery = useInstallerSupportTickets();
  const page = ticketsQuery.data?.data;
  const tickets = page?.items ?? [];
  const [
    openId,
    setOpenId,
  ] = useState<string>();

  const counts = [
    [
      "Total",
      page?.counts.total,
    ],
    [
      "Open",
      page?.counts.open,
    ],
    [
      "In progress",
      page?.counts.inProgress,
    ],
    [
      "Escalated",
      page?.counts.escalated,
    ],
    [
      "Closed",
      page?.counts.closed,
    ],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tickets</CardTitle>
        <CardDescription>Support tickets you have raised. Every status change arrives as a notification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map(([
            label,
            value,
          ]) => (
            <div
              key={label}
              className="rounded-xl border p-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Raised</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsQuery.isLoading && (
                <MessageRow>
                  <p className="text-muted-foreground">Loading tickets…</p>
                </MessageRow>
              )}
              {ticketsQuery.isError && (
                <MessageRow>
                  <p className="text-muted-foreground">Unable to load your tickets.</p>
                  <Button
                    variant="link"
                    onClick={() => ticketsQuery.refetch()}
                  >
                    Try again
                  </Button>
                </MessageRow>
              )}
              {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.map(t => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(t.id)}
                >
                  <TableCell className="font-medium">{t.displayId}</TableCell>
                  <TableCell className="capitalize">
                    {labelOf(
                      options?.supportCategories,
                      t.category,
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {labelOf(
                      options?.priorities,
                      t.priority,
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {labelOf(
                      options?.ticketStatuses,
                      t.status,
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateInTimezone(
                      t.createdAt,
                      zone,
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 && (
                <MessageRow>
                  <p className="font-medium">No tickets yet</p>
                  <p className="text-xs text-muted-foreground">
                    Report an issue and it will appear here.
                  </p>
                </MessageRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <TicketDialog
        id={openId}
        zone={zone}
        onClose={() => setOpenId(undefined)}
      />
    </Card>
  );
}

function MessageRow({ children }: { children: ReactNode }) {
  return (
    <TableRow>
      <TableCell
        colSpan={5}
        className="py-12 text-center text-sm"
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

/** GET /auth/installer/support/tickets/:id — read-only, with its related job and attachments. */
function TicketDialog({
  id, zone, onClose,
}: {
  id: string | undefined;
  zone: string | undefined;
  onClose: () => void;
}) {
  const options = useInstallerOptions().data?.data;
  const ticketQuery = useInstallerSupportTicket(id);
  const ticket = ticketQuery.data?.data;
  const [
    downloading,
    setDownloading,
  ] = useState<string>();

  async function download(attachmentId: string) {
    if (!id)
      return;
    setDownloading(attachmentId);
    try {
      // The link is short-lived, so it is fetched on click rather than with the ticket.
      const res = await getInstallerSupportTicketAttachmentLink({
        id,
        attachmentId,
      });
      window.open(
        res.data.url,
        "_blank",
        "noopener",
      );
    }
    catch {
      toast.error("Unable to download that attachment.");
    }
    finally {
      setDownloading(undefined);
    }
  }

  return (
    <Dialog
      open={!!id}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ticket?.displayId ?? "Ticket"}</DialogTitle>
          <DialogDescription>
            {ticket
              ? `${labelOf(
                options?.supportCategories,
                ticket.category,
              )} · raised ${formatDateInTimezone(
                ticket.createdAt,
                zone,
              )}`
              : ticketQuery.isError ? "Unable to load this ticket." : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {ticket && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="capitalize"
              >
                {labelOf(
                  options?.ticketStatuses,
                  ticket.status,
                )}
              </Badge>
              <Badge
                variant="outline"
                className="capitalize"
              >
                {labelOf(
                  options?.priorities,
                  ticket.priority,
                )}
              </Badge>
            </div>

            <p className="whitespace-pre-wrap">{ticket.description}</p>

            {ticket.relatedJob && (
              <p>
                <span className="text-muted-foreground">Related job: </span>
                <Link
                  to={`/jobs/${ticket.relatedJob.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {ticket.relatedJob.jobNumber}
                </Link>
              </p>
            )}

            {ticket.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">Attachments</p>
                {ticket.attachments.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-xl border p-2 pl-3"
                  >
                    <span className="truncate">{a.fileName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => download(a.id)}
                      loading={downloading === a.id}
                      aria-label={`Download ${a.fileName}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
