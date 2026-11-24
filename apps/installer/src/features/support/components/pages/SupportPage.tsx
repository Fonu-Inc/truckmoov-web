import type { ColumnDef } from "@tanstack/react-table";
import type {
  InstallerIssueType,
  InstallerOptionItem,
  InstallerSupportTicket,
  InstallerSupportTicketStatus,
  SupportTicketPriority,
} from "@truckmoov/api/auth";
import type { ElementType } from "react";
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
import { debounce } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  formatDateOnlyInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Cpu,
  Download,
  Eye,
  HelpCircle,
  LifeBuoy,
  Lightbulb,
  Loader,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
  Wifi,
  Wrench,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
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
    description: "Faulty unit, damaged wiring harness, device will not power up.",
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
    description: "Device will not accept configuration or stays in the queue.",
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
    description: "No network, SIM not active, device not reporting after install.",
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
    description: "Job details wrong, customer unavailable, need to reschedule.",
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
    description: "Cannot reach the site, access denied, unsafe working conditions.",
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
    description: "Portal access, notifications, profile or capability changes.",
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
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={setTab}
      >
        <TabsList>
          <TabsTrigger
            value="report"
            className="gap-2"
          >
            <LifeBuoy className="h-4 w-4" />
            {" "}
            Report an Issue
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            {" "}
            My Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="report"
          className="mt-3 space-y-6"
        >
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">Support Tickets are for broader help and escalation.</p>
            <p className="mt-1 text-muted-foreground">For a problem affecting an active job, use Report Issue inside that installation so it remains linked to the work.</p>
          </div>
          <ReportIssue onSubmitted={() => setTab("tickets")} />
        </TabsContent>

        <TabsContent
          value="tickets"
          className="mt-3 space-y-4"
        >
          <div className="flex justify-end">
            <Button onClick={() => setTab("report")}>
              <Plus className="mr-2 h-4 w-4" />
              {" "}
              Log Ticket
            </Button>
          </div>
          <MyTickets />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** POST /auth/installer/support/tickets. */
function ReportIssue({ onSubmitted }: { onSubmitted: () => void }) {
  const optionsQuery = useInstallerOptions();
  const options = optionsQuery.data?.data;
  const phone = useInstallerProfile().data?.data.personal.phoneNumber ?? "";
  // ponytail: first 100 active jobs; a search box when installers carry more.
  const jobsQuery = useInstallerJobs({ limit: 100 });
  const jobs = jobsQuery.data?.data.items ?? [];
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
  const chips: InstallerOptionItem[] = serverCategory?.chips
    ?? selected?.issues.map(label => ({
      key: label,
      label,
    }))
    ?? [];
  const hasServerChips = !!serverCategory?.chips;

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

  const Icon = selected?.icon;
  if (selected && Icon) {
    return (
      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="p-6 pb-4 space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit gap-2"
            onClick={reset}
          >
            <ArrowLeft className="h-4 w-4" />
            {" "}
            Back to categories
          </Button>
          <CardTitle className="font-display flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {" "}
            {serverCategory?.label ?? selected.label}
          </CardTitle>
          <CardDescription>{serverCategory?.description ?? selected.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-5">
          {chips.length > 0 && (
            <div className="space-y-2">
              <Label>What is happening?</Label>
              <div className="flex flex-wrap gap-2">
                {chips.map(c => (
                  <Badge
                    key={c.key}
                    variant={issue === c.key ? "default" : "outline"}
                    className="cursor-pointer rounded-full px-3 py-1.5"
                    onClick={() => setIssue(c.key)}
                  >
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Related installation job (optional)</Label>
              <Select
                value={jobId || "none"}
                onValueChange={v => setJobId(v === "none" ? "" : v)}
                disabled={jobsQuery.isLoading}
              >
                <SelectTrigger>
                  {jobsQuery.isLoading ? <span className="text-muted-foreground">Loading jobs…</span> : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not related to a job</SelectItem>
                  {jobsQuery.isError && (
                    <SelectItem
                      value="error"
                      disabled
                    >
                      Unable to load your jobs
                    </SelectItem>
                  )}
                  {jobs.map(j => (
                    <SelectItem
                      key={j.id}
                      value={j.id}
                    >
                      {j.jobNumber}
                      {j.companyName && ` - ${j.companyName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>Details from the field</Label>
            <Textarea
              rows={5}
              maxLength={4000}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Device IMEI, vehicle registration, what you tried on site, readings you took..."
            />
          </div>

          <div className="space-y-2">
            <Label>Your callback number</Label>
            <Input
              value={phone}
              readOnly
              className="bg-muted/40"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={reset}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={createTicket.isPending}
              disabled={!details.trim()}
            >
              Submit to installation desk
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <QueryState
      query={optionsQuery}
      errorMessage="Unable to load the support categories."
      skeleton={(
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map(c => (
            <Skeleton
              key={c.key}
              className="h-40 rounded-2xl"
            />
          ))}
        </div>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((c) => {
          const server = options?.supportCategories.find(o => o.key === c.key);
          return (
            <Card
              key={c.key}
              className="surface-sleek rounded-2xl cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setSelected(c)}
            >
              <CardHeader className="p-6 pb-4 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="font-display">{server?.label ?? c.label}</CardTitle>
                <CardDescription>{server?.description ?? c.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="font-display flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            {" "}
            Field tips before you raise a ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-2 text-sm text-muted-foreground">
          {options?.fieldTips.length
            ? options.fieldTips.map(tip => (
                <p key={tip}>
                  •
                  {" "}
                  {tip}
                </p>
              ))
            : <p>No field tips yet.</p>}
        </CardContent>
      </Card>
    </QueryState>
  );
}

/** GET /auth/installer/support/tickets — every filter goes to the server. ponytail: first page only; add paging when installers carry more. */
function MyTickets() {
  const options = useInstallerOptions().data?.data;
  const zone = useInstallerDisplayPreferences().data?.data.timezone;
  const [
    searchInput,
    setSearchInput,
  ] = useState("");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<"all" | InstallerSupportTicketStatus>("all");
  const [
    filters,
    setFilters,
  ] = useState<TicketFilters>({});
  const applySearch = useMemo(
    () => debounce(
      (v: string) => setSearch(v.trim()),
      400,
    ),
    [],
  );
  useEffect(
    () => () => applySearch.cancel(),
    [applySearch],
  );

  const {
    page: currentPage, pageSize, pagination,
  } = useServerPagination([
    status,
    search,
    filters,
  ]);
  const ticketsQuery = useInstallerSupportTickets({
    params: {
      ...(status !== "all" && { status }),
      ...(search && { search }),
      ...filters,
      page: currentPage,
      limit: pageSize,
    },
  });
  const page = ticketsQuery.data?.data;
  const tickets = page?.items ?? [];
  const [
    openId,
    setOpenId,
  ] = useState<string>();
  const filtering = !!(search || status !== "all" || filters.category || filters.priority);

  const columns = useMemo<ColumnDef<InstallerSupportTicket>[]>(
    () => [
      {
        header: "Ticket ID",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.displayId}</span>,
      },
      {
        header: "Title",
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        header: "Message",
        cell: ({ row }) => (
          <span
            className="block max-w-[260px] truncate text-muted-foreground"
            title={row.original.message}
          >
            {row.original.message}
          </span>
        ),
      },
      {
        header: "Category",
        cell: ({ row }) => row.original.categoryLabel,
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="rounded-full px-2.5"
          >
            {row.original.statusLabel}
          </Badge>
        ),
      },
      {
        header: "Priority",
        cell: ({ row }) => <span className="capitalize">{row.original.priority}</span>,
      },
      {
        header: "Date Submitted",
        cell: ({ row }) => formatDateOnlyInTimezone(
          row.original.createdAt,
          zone,
        ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenId(row.original.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        ),
      },
    ],
    [zone],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={page?.counts.total ?? 0}
          icon={ClipboardList}
          loading={ticketsQuery.isLoading}
        />
        <StatCard
          title="Open"
          value={page?.counts.open ?? 0}
          icon={CircleDot}
          loading={ticketsQuery.isLoading}
        />
        <StatCard
          title="In Progress"
          value={page?.counts.inProgress ?? 0}
          icon={Loader}
          variant="warning"
          loading={ticketsQuery.isLoading}
        />
        <StatCard
          title="Resolved"
          value={page?.counts.closed ?? 0}
          icon={CheckCircle2}
          variant="success"
          loading={ticketsQuery.isLoading}
        />
      </div>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="p-6 pb-4 space-y-4">
          <CardTitle className="font-display">My Support Tickets</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  applySearch(e.target.value);
                }}
                placeholder="Search tickets..."
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={v => setStatus(v as typeof status)}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(options?.ticketStatuses ?? []).map(s => (
                  <SelectItem
                    key={s.key}
                    value={s.key}
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TicketFilter
              value={filters}
              onApply={setFilters}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="overflow-x-auto rounded-xl border">
            <DataTable
              columns={columns}
              data={tickets}
              isLoading={ticketsQuery.isLoading}
              isError={ticketsQuery.isError}
              errorMessage={ticketsQuery.error?.message || "Unable to load your tickets."}
              onRetry={() => ticketsQuery.refetch()}
              hasActiveFilters={filtering}
              pagination={pagination(page?.total ?? 0)}
              emptyState={(
                <div className="py-4">
                  <p className="text-sm font-medium text-foreground">No tickets yet</p>
                  <p className="text-xs">Report an issue and it will appear here.</p>
                </div>
              )}
              filteredEmptyState={(
                <div className="py-4">
                  <p className="text-sm font-medium text-foreground">No matching tickets</p>
                  <p className="text-xs">Nothing matches these filters.</p>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <TicketDialog
        id={openId}
        zone={zone}
        onClose={() => setOpenId(undefined)}
      />
    </div>
  );
}

type TicketFilters = {
  category?: string; priority?: SupportTicketPriority;
};

function TicketFilter({
  value, onApply,
}: {
  value: TicketFilters;
  onApply: (v: TicketFilters) => void;
}) {
  const options = useInstallerOptions().data?.data;
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    draft,
    setDraft,
  ] = useState(value);
  const active = Object.values(value).filter(Boolean).length;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o)
          setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {active > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{active}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-4 space-y-4"
      >
        <h4 className="text-xs font-medium text-foreground px-0.5">Only show tickets by...</h4>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={draft.category ?? "all"}
            onValueChange={v => setDraft(d => ({
              ...d,
              category: v === "all" ? undefined : v,
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(options?.supportCategories ?? []).map(c => (
                <SelectItem
                  key={c.key}
                  value={c.key}
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={draft.priority ?? "all"}
            onValueChange={v => setDraft(d => ({
              ...d,
              priority: v === "all" ? undefined : v as SupportTicketPriority,
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map(p => (
                <SelectItem
                  key={p}
                  value={p}
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
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            className="flex-1"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onApply({});
              setOpen(false);
            }}
          >
            Show All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
              ? `${ticket.categoryLabel} · raised ${formatDateInTimezone(
                ticket.createdAt,
                zone,
              )}`
              : "Support ticket details"}
          </DialogDescription>
        </DialogHeader>

        <QueryState
          query={ticketQuery}
          errorMessage="Unable to load this ticket."
          skeleton={(
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          )}
        >
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
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}
